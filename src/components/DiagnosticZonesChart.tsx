// DiagnosticZonesChart.tsx
// ✅ Version COMPLETE (anti width/height -1) + zones courbes (IMC-like) + trajectoire patient + CI optionnel
// Recharts + Tailwind
//
// IMPORTANT :
// - Ton backend doit renvoyer results.zone_boundaries.{male|female}[] avec :
//   age, green_bottom, green_blue, blue_red, red_top (et optionnel mu/sigma/n)
// - Ton backend doit renvoyer results.percentile_curves.patient_trajectory[] avec :
//   age, delta_nca, type ('historical'|'current'|'projected'), (optionnel ci_lower/ci_upper)

import React, { useMemo } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { ExtendedPredictionOutput } from "../types";

interface DiagnosticZonesChartProps {
  results: ExtendedPredictionOutput;
  height?: number;
}

type BoundaryRow = {
  age: number;
  green_bottom: number;
  green_blue: number;
  blue_red: number;
  red_top: number;
};

type PatientPoint = {
  age: number;
  delta_nca: number;
  type: "historical" | "current" | "projected";
  ci_lower?: number;
  ci_upper?: number;
};



/**
 * ✅ Anti Recharts width/height(-1) :
 * On attend que le conteneur ait une vraie taille (ResizeObserver),
 * sinon on affiche un "Chargement du graphique…" au lieu de monter Recharts.
 */
function useElementSize<T extends HTMLElement>() {
  const ref = React.useRef<T | null>(null);
  const [size, setSize] = React.useState({ width: 0, height: 0 });

  React.useEffect(() => {
    if (!ref.current) return;

    const el = ref.current;

    const ro = new ResizeObserver((entries) => {
      const cr = entries[0]?.contentRect;
      if (!cr) return;
      setSize({ width: cr.width, height: cr.height });
    });

    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return { ref, size };
}

export function DiagnosticZonesChart({ results, height = 520 }: DiagnosticZonesChartProps) {
  if (!results?.zone_boundaries) {
    return <div className="text-gray-400 text-center p-8">Données non disponibles</div>;
  }

  const patientSex = results.zone_boundaries.patient_sex; // 1 homme, 0 femme
  const boundariesRaw = (patientSex === 1
    ? results.zone_boundaries.male
    : results.zone_boundaries.female) as BoundaryRow[];

  const patientTrajectory = (results.percentile_curves?.patient_trajectory || []) as PatientPoint[];
  const currentPoint = patientTrajectory.find((p) => p.type === "current");
  const sexLabel = patientSex === 1 ? "👨 Hommes" : "👩 Femmes";

  // 1) Préparer les zones en "stack" (offset + band)
  const zoneData = useMemo(() => {
    const rows = (boundariesRaw || [])
      .filter((d) => d && Number.isFinite(Number(d.age)))
      .map((d) => {
        const age = Number(d.age);
        const gb = Number(d.green_blue);
        const br = Number(d.blue_red);
        const bottom = Number(d.green_bottom);
        const top = Number(d.red_top);

        // sécurités
        const safeBottom = Number.isFinite(bottom) ? bottom : -30;
        const safeGb = Number.isFinite(gb) ? gb : safeBottom + 1;
        const safeBr = Number.isFinite(br) ? br : safeGb + 1;
        const safeTop = Number.isFinite(top) ? top : safeBr + 1;

        return {
          age,

          // stack vert: [bottom -> gb]
          g_offset: safeBottom,
          g_band: Math.max(0, safeGb - safeBottom),

          // stack bleu: [gb -> br]
          b_offset: safeGb,
          b_band: Math.max(0, safeBr - safeGb),

          // stack rouge: [br -> top]
          r_offset: safeBr,
          r_band: Math.max(0, safeTop - safeBr),

          // lignes frontières
          green_blue: safeGb,
          blue_red: safeBr,

          // extra
          green_bottom: safeBottom,
          red_top: safeTop,
        };
      })
      .sort((a, b) => a.age - b.age);

    return rows;
  }, [boundariesRaw]);

  // 2) Domaine X et Y à partir des zones + patient
  const xDomain = useMemo<[number, number]>(() => {
    const ages = zoneData.map((d) => d.age).filter((a) => Number.isFinite(a));
    if (!ages.length) return [50, 90];
    return [Math.min(...ages), Math.max(...ages)];
  }, [zoneData]);

  const yDomain = useMemo<[number, number]>(() => {
    const ys: number[] = [];

    for (const d of zoneData) ys.push(d.green_bottom, d.green_blue, d.blue_red, d.red_top);

    for (const p of patientTrajectory) {
      if (p?.delta_nca != null && Number.isFinite(Number(p.delta_nca))) ys.push(Number(p.delta_nca));
      if (p?.ci_lower != null && Number.isFinite(Number(p.ci_lower))) ys.push(Number(p.ci_lower));
      if (p?.ci_upper != null && Number.isFinite(Number(p.ci_upper))) ys.push(Number(p.ci_upper));
    }

    if (!ys.length) return [-30, 30];

    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);

    // padding
    return [minY - 2, maxY + 2];
  }, [zoneData, patientTrajectory]);

  // 3) Préparer bande CI (optionnelle) via stack trick (lower + (upper-lower))
  const patientDataForCI = useMemo(() => {
    return patientTrajectory
      .map((p) => {
        const age = Number(p.age);
        const delta = Number(p.delta_nca);

        const hasCI =
          p.type === "projected" &&
          p.ci_lower != null &&
          p.ci_upper != null &&
          Number.isFinite(Number(p.ci_lower)) &&
          Number.isFinite(Number(p.ci_upper));

        return {
          ...p,
          age,
          delta_nca: delta,
          ci_offset: hasCI ? Number(p.ci_lower) : null,
          ci_band: hasCI ? Math.max(0, Number(p.ci_upper) - Number(p.ci_lower)) : null,
        };
      })
      .filter((p) => Number.isFinite(p.age) && Number.isFinite(p.delta_nca))
      .sort((a, b) => a.age - b.age);
  }, [patientTrajectory]);

  // 4) Zone actuelle (simple) par comparaison aux frontières à âge proche
  const zoneLabel = useMemo(() => {
    if (!currentPoint || !zoneData.length) return "—";
    const age = Number(currentPoint.age);
    const delta = Number(currentPoint.delta_nca);

    const nearest = zoneData.reduce((best, cur) =>
      Math.abs(cur.age - age) < Math.abs(best.age - age) ? cur : best
    );

    if (delta < nearest.green_blue) return "Normale (CON/SCD)";
    if (delta < nearest.blue_red) return "MCI";
    return "AD / Autres démences";
  }, [currentPoint, zoneData]);

  // ✅ Anti-size bug
  const { ref: containerRef, size } = useElementSize<HTMLDivElement>();
  const isReady = size.width > 5 && size.height > 5;

  // Si pas de données zones: on évite de rendre un chart vide
  if (!zoneData.length) {
    return <div className="text-gray-400 text-center p-8">Zones non disponibles</div>;
  }

  return (
    <div className="space-y-4">
      {/* Titre */}
      <div className="text-center mb-2">
        <h3 className="text-lg font-semibold text-white">Zones diagnostiques — {sexLabel}</h3>
        <p className="text-sm text-gray-400">Style IMC : zones courbes + trajectoire patient (5/10 ans)</p>
      </div>

      {/* ✅ Wrapper mesurable */}
      <div
        ref={containerRef}
        className="w-full min-w-0 rounded-lg"
        style={{
          height,
          minWidth: 1,
          minHeight: 1,
        }}
      >
        {isReady ? (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={zoneData} margin={{ top: 16, right: 20, left: 18, bottom: 44 }}>
              <defs>
                <linearGradient id="greenZone" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22c55e" stopOpacity={0.55} />
                  <stop offset="100%" stopColor="#22c55e" stopOpacity={0.25} />
                </linearGradient>
                <linearGradient id="blueZone" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.55} />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.25} />
                </linearGradient>
                <linearGradient id="redZone" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity={0.55} />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity={0.25} />
                </linearGradient>
                <linearGradient id="ciFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ff6b00" stopOpacity={0.22} />
                  <stop offset="100%" stopColor="#ff6b00" stopOpacity={0.08} />
                </linearGradient>
              </defs>

              <CartesianGrid stroke="#374151" strokeDasharray="3 3" />

              <XAxis
                dataKey="age"
                type="number"
                domain={xDomain as any}
                stroke="#9ca3af"
                tick={{ fill: "#9ca3af" }}
                label={{
                  value: "Âge (années)",
                  position: "insideBottom",
                  offset: -14,
                  fill: "#9ca3af",
                  fontSize: 13,
                }}
              />

              <YAxis
                stroke="#9ca3af"
                domain={yDomain as any}
                tick={{ fill: "#9ca3af" }}
                label={{
                  value: "Delta NCA (années)",
                  angle: -90,
                  position: "insideLeft",
                  fill: "#9ca3af",
                  fontSize: 13,
                }}
              />

              <Tooltip
  content={(props) => {
    const { payload, label } = props;
    if (!payload || payload.length === 0) return null;

    const age = label;
    
    // Trouver le point patient à cet âge
    const patientPoint = patientTrajectory.find(p => 
      Math.abs(Number(p.age) - Number(age)) < 0.5
    );

    if (!patientPoint) {
      // Juste afficher l'âge et les limites des zones
      const zonePoint = payload[0]?.payload;
      
      return (
        <div className="bg-gray-900 p-3 rounded-lg border border-gray-700">
          <p className="text-white font-semibold mb-2">Âge : {age} ans</p>
          <div className="space-y-1 text-sm">
            <p className="text-green-400">Zone Normale : &lt; {zonePoint?.green_blue?.toFixed(1)} ans</p>
            <p className="text-blue-400">Zone MCI : {zonePoint?.green_blue?.toFixed(1)} à {zonePoint?.blue_red?.toFixed(1)} ans</p>
            <p className="text-red-400">Zone Pathologique : &gt; {zonePoint?.blue_red?.toFixed(1)} ans</p>
          </div>
        </div>
      );
    }

    // Si patient présent : afficher sa position
    const delta = Number(patientPoint.delta_nca);
    const zonePoint = payload[0]?.payload;
    
    let zoneLabel = "Zone Normale";
    let zoneColor = "text-green-400";
    
    if (zonePoint) {
      if (delta > zonePoint.blue_red) {
        zoneLabel = "Zone Pathologique";
        zoneColor = "text-red-400";
      } else if (delta > zonePoint.green_blue) {
        zoneLabel = "Zone MCI";
        zoneColor = "text-blue-400";
      }
    }

    return (
      <div className="bg-gray-900 p-3 rounded-lg border border-gray-700">
        <p className="text-white font-semibold mb-2">Patient</p>
        <div className="space-y-1">
          <p className="text-gray-300">Âge : <span className="text-white font-semibold">{age} ans</span></p>
          <p className="text-gray-300">Delta NCA : <span className="text-orange-500 font-semibold">{delta.toFixed(1)} ans</span></p>
          <p className={`${zoneColor} font-semibold`}>{zoneLabel}</p>
          
          // ✅ CORRECT
{patientPoint.type === 'projected' && patientPoint.ci_lower && patientPoint.ci_upper && (
  <p className="text-gray-400 text-xs mt-2">
    IC 95% : [{patientPoint.ci_lower.toFixed(1)}, {patientPoint.ci_upper.toFixed(1)}]
  </p>
)}
        </div>
      </div>
    );
  }}
/>

              {/* ===== Zones empilées ===== */}
              {/* Vert */}
              <Area dataKey="g_offset" stackId="zones" stroke="none" fill="transparent" isAnimationActive={false} />
              <Area dataKey="g_band" stackId="zones" stroke="none" fill="url(#greenZone)" name="Zone normale" isAnimationActive={false} />

              {/* Bleu */}
              <Area dataKey="b_offset" stackId="zones" stroke="none" fill="transparent" isAnimationActive={false} />
              <Area dataKey="b_band" stackId="zones" stroke="none" fill="url(#blueZone)" name="Zone MCI" isAnimationActive={false} />

              {/* Rouge */}
              <Area dataKey="r_offset" stackId="zones" stroke="none" fill="transparent" isAnimationActive={false} />
              <Area dataKey="r_band" stackId="zones" stroke="none" fill="url(#redZone)" name="Zone pathologique" isAnimationActive={false} />

              {/* Frontières courbes */}
              <Line
                dataKey="green_blue"
                stroke="#10b981"
                strokeWidth={2}
                dot={false}
                strokeDasharray="6 6"
                name="Limite Normale / MCI (μ+1σ)"
                isAnimationActive={false}
              />
              <Line
                dataKey="blue_red"
                stroke="#f59e0b"
                strokeWidth={2}
                dot={false}
                strokeDasharray="6 6"
                name="Limite MCI / Démence (μ+2σ)"
                isAnimationActive={false}
              />

              {/* ===== Bande CI du patient (optionnelle) ===== */}
              <Area data={patientDataForCI as any} dataKey="ci_offset" stackId="ci" stroke="none" fill="transparent" isAnimationActive={false} />
              <Area data={patientDataForCI as any} dataKey="ci_band" stackId="ci" stroke="none" fill="url(#ciFill)" name="IC 95% (delta)" isAnimationActive={false} />

              {/* ===== Trajectoire patient ===== */}
              <Line
                data={patientTrajectory as any}
                dataKey="delta_nca"
                stroke="#ff6b00"
                strokeWidth={4}
                dot={(props: any) => {
                  const { cx, cy, payload } = props;
                  const isCurrent = payload?.type === "current";
                  const r = isCurrent ? 10 : 6;
                  return <circle cx={cx} cy={cy} r={r} fill="#ff6b00" stroke="#ffffff" strokeWidth={3} />;
                }}
                name="Patient"
                isAnimationActive={false}
              />

              <Legend iconType="square" />
            </ComposedChart>
          </ResponsiveContainer>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-500 text-sm">
            Chargement du graphique…
          </div>
        )}
      </div>

      {/* Résumé position */}
      {currentPoint && (
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 bg-gray-800 rounded-lg">
            <p className="text-xs text-gray-400 mb-1">Delta NCA actuel</p>
            <p className="text-2xl font-bold text-orange-500">
              {Number(currentPoint.delta_nca) > 0 ? "+" : ""}
              {Number(currentPoint.delta_nca).toFixed(1)} ans
            </p>
          </div>

          <div className="p-4 bg-gray-800 rounded-lg">
            <p className="text-xs text-gray-400 mb-1">Âge actuel</p>
            <p className="text-2xl font-bold text-white">{Number(currentPoint.age).toFixed(0)} ans</p>
          </div>

          <div className="p-4 bg-gray-800 rounded-lg">
            <p className="text-xs text-gray-400 mb-1">Zone actuelle</p>
            <p className="text-xl font-bold text-white">{zoneLabel}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default DiagnosticZonesChart;