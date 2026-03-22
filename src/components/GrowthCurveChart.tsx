// GrowthCurveChart.tsx - VERSION AVEC INTÉGRATION NCA

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
  ReferenceDot,
} from "recharts";
import { ExtendedPredictionOutput } from "../types";

// Helpers
function formatNumber(value: number | null | undefined, decimals: number = 1, fallback: string = "—"): string {
  if (value === null || value === undefined || isNaN(value)) return fallback;
  return Number(value).toFixed(decimals);
}

function formatInteger(value: number | null | undefined, fallback: string = "—"): string {
  if (value === null || value === undefined || isNaN(value)) return fallback;
  return Math.round(Number(value)).toString();
}

function formatNumberWithSign(value: number | null | undefined, decimals: number = 1, fallback: string = "—"): string {
  if (value === null || value === undefined || isNaN(value)) return fallback;
  const num = Number(value);
  return (num > 0 ? "+" : "") + num.toFixed(decimals);
}

interface GrowthCurveChartProps {
  results: ExtendedPredictionOutput;
  height?: number;
}

export function GrowthCurveChart({ results, height = 600 }: GrowthCurveChartProps) {
  const centileCurves = results.centile_curves;
  const ncaPrediction = results.nca_prediction;  // ✅ NOUVEAU
  
  if (!centileCurves) {
    return (
      <div className="text-center p-12 bg-gray-800/50 rounded-lg">
        <p className="text-gray-400">Données de centiles non disponibles</p>
      </div>
    );
  }

  const patientSex = centileCurves.patient_sex;
  const curves = patientSex === 1 ? centileCurves.male : centileCurves.female;
  const zoneBoundaries = results.zone_boundaries;
  const patientZones = patientSex === 1 ? zoneBoundaries?.male : zoneBoundaries?.female;
  
  // ✅ PRIORITÉ 1 : Données NCA si disponibles, sinon patient_point existant
  const patientPoint = useMemo(() => {
    if (ncaPrediction) {
      // Utiliser les données NCA
      return {
        age: ncaPrediction.age_chronologique,
        delta_nca: ncaPrediction.delta_nca,
        centile: centileCurves.patient_point?.centile,  // Garder centile si disponible
        interpretation: ncaPrediction.interpretation,
        zone: undefined  // Sera calculé ci-dessous
      };
    }
    // Fallback sur patient_point existant
    return centileCurves.patient_point;
  }, [ncaPrediction, centileCurves.patient_point]);

  // ✅ Limites d'axe Y
  const axisDomain = centileCurves.axis_domain || [-15, 25];
  const Y_MIN = axisDomain[0];
  const Y_MAX = axisDomain[1];
  const Y_TICKS = [-15, -10, -5, 0, 5, 10, 15, 20, 25];

  // ✅ Extraire les limites de zones
  const zoneLimits = useMemo(() => {
    if (zoneBoundaries?.limits) {
      return zoneBoundaries.limits;
    }
    
    if (patientZones && patientZones.length > 0) {
      const middleZone = patientZones.find(z => z.age === 65) || patientZones[Math.floor(patientZones.length / 2)];
      return {
        normal_mci: middleZone.green_blue,
        mci_ad: middleZone.blue_red
      };
    }
    
    return {
      normal_mci: 5,
      mci_ad: 10
    };
  }, [zoneBoundaries, patientZones]);

  // Préparer données pour le graphique
  const chartData = useMemo(() => {
    if (!curves || !patientZones) return [];

    return curves.map((curve: any) => {
      const zone = patientZones.find((z: any) => z.age === curve.age);
      if (!zone) return null;

      const green_bottom = zone.green_bottom || Y_MIN;
      const green_top = zone.green_blue || zoneLimits.normal_mci;
      const blue_top = zone.blue_red || zoneLimits.mci_ad;
      const red_top = zone.red_top || Y_MAX;

      return {
        age: curve.age,
        zone_offset: green_bottom,
        zone_green_height: green_top - green_bottom,
        zone_blue_height: blue_top - green_top,
        zone_red_height: red_top - blue_top,
        green_top: green_top,
        blue_top: blue_top,
        p3: curve.p3,
        p10: curve.p10,
        p25: curve.p25,
        p50: curve.p50,
        p75: curve.p75,
        p90: curve.p90,
        p97: curve.p97,
      };
    }).filter(Boolean);
  }, [curves, patientZones, zoneLimits, Y_MIN, Y_MAX]);

  // ✅ Trajectoire future AMÉLIORÉE avec NCA
  const futureTrajectory = useMemo(() => {
    if (!patientPoint) return [];

    const trajectory = [];
    const currentDelta = patientPoint.delta_nca || 0;
    
    // ✅ Si on a les données NCA, on peut estimer le déclin
    const annualDecline = ncaPrediction ? 0.3 : 0;  // Estimation: +0.3 an/an de déclin
    
    for (let year = 1; year <= 5; year++) {
      const futureAge = patientPoint.age + year;
      const futureDelta = currentDelta + (annualDecline * year);
      
      let zone = "Normale";
      if (futureDelta >= zoneLimits.mci_ad) {
        zone = "Pathologique";
      } else if (futureDelta >= zoneLimits.normal_mci) {
        zone = "MCI";
      }
      
      trajectory.push({
        year,
        age: futureAge,
        delta: futureDelta,
        zone
      });
    }
    
    return trajectory;
  }, [patientPoint, zoneLimits, ncaPrediction]);

  // ✅ Déterminer zone actuelle
  const currentZone = useMemo(() => {
    if (!patientPoint) return "—";
    
    const delta = patientPoint.delta_nca || 0;
    if (delta < zoneLimits.normal_mci) return "Normale";
    if (delta < zoneLimits.mci_ad) return "MCI";
    return "Pathologique";
  }, [patientPoint, zoneLimits]);

  const CENTILE_LINES = [
    { key: "p3", color: "#6b7280", width: 1.5, dash: "5 5", label: "3e" },
    { key: "p10", color: "#9ca3af", width: 2, dash: "4 4", label: "10e" },
    { key: "p25", color: "#d1d5db", width: 2, dash: "4 4", label: "25e" },
    { key: "p50", color: "#ffffff", width: 4, dash: undefined, label: "Médiane" },
    { key: "p75", color: "#d1d5db", width: 2, dash: "4 4", label: "75e" },
    { key: "p90", color: "#9ca3af", width: 2, dash: "4 4", label: "90e" },
    { key: "p97", color: "#6b7280", width: 1.5, dash: "5 5", label: "97e" },
  ];

  return (
    <div className="space-y-4">
      <div className="bg-gray-900 p-4 rounded-lg">
        <ResponsiveContainer width="100%" height={height}>
          <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />

            <XAxis
              dataKey="age"
              stroke="#9ca3af"
              label={{ value: "Âge (années)", position: "insideBottom", offset: -10, fill: "#9ca3af" }}
              domain={[50, 90]}
              ticks={[50, 55, 60, 65, 70, 75, 80, 85, 90]}
            />

            <YAxis
              stroke="#9ca3af"
              label={{ value: "Delta NCA (années)", angle: -90, position: "insideLeft", fill: "#9ca3af" }}
              domain={[Y_MIN, Y_MAX]}
              ticks={Y_TICKS}
            />

            <Tooltip
              content={(props) => {
                const { payload, label } = props;
                if (!payload || payload.length === 0) return null;

                const data = payload[0]?.payload;

                return (
                  <div className="bg-gray-900 p-3 rounded-lg border border-gray-700">
                    <p className="text-white font-semibold mb-2">Âge : {label} ans</p>
                    <div className="space-y-1 text-xs">
                      <p className="text-green-400">Zone Normale : &lt; {formatNumber(data?.green_top, 1)} ans</p>
                      <p className="text-blue-400">Zone MCI : {formatNumber(data?.green_top, 1)} - {formatNumber(data?.blue_top, 1)} ans</p>
                      <p className="text-red-400">Zone Pathologique : &gt; {formatNumber(data?.blue_top, 1)} ans</p>
                    </div>
                  </div>
                );
              }}
            />

            <Legend wrapperStyle={{ paddingTop: "20px" }} />

            {/* Zones pleines empilées */}
            <Area dataKey="zone_offset" stackId="zones" fill="transparent" stroke="none" />
            <Area 
              dataKey="zone_green_height" 
              stackId="zones" 
              fill="#10b981" 
              fillOpacity={0.85} 
              stroke="#10b981" 
              strokeWidth={3}
              name="Zone Normale"
            />
            <Area 
              dataKey="zone_blue_height" 
              stackId="zones" 
              fill="#3b82f6" 
              fillOpacity={0.75} 
              stroke="#3b82f6" 
              strokeWidth={3}
              name="Zone MCI"
            />
            <Area 
              dataKey="zone_red_height" 
              stackId="zones" 
              fill="#ef4444" 
              fillOpacity={0.65} 
              stroke="#ef4444" 
              strokeWidth={3}
              name="Zone Pathologique"
            />

            {/* Limites entre zones */}
            <Line 
              dataKey="green_top" 
              stroke="#10b981" 
              strokeWidth={5} 
              dot={false}
              name="Limite Normale/MCI"
            />
            <Line 
              dataKey="blue_top" 
              stroke="#f59e0b" 
              strokeWidth={5} 
              dot={false}
              name="Limite MCI/Pathologique"
            />

            {/* Courbes de centiles */}
            {CENTILE_LINES.map((line) => (
              <Line
                key={line.key}
                dataKey={line.key}
                stroke={line.color}
                strokeWidth={line.width}
                strokeDasharray={line.dash}
                dot={false}
                name={line.label}
              />
            ))}

            {/* Point patient actuel */}
            {patientPoint && (
              <ReferenceDot
                x={patientPoint.age}
                y={patientPoint.delta_nca}
                r={18}
                fill="#ff6b00"
                stroke="#ffffff"
                strokeWidth={6}
              />
            )}

            {/* Trajectoire future */}
            {futureTrajectory.map((point, idx) => (
              <ReferenceDot
                key={idx}
                x={point.age}
                y={point.delta}
                r={10}
                fill="#fbbf24"
                stroke="#ffffff"
                strokeWidth={3}
                label={{ value: `+${point.year}`, fill: "#fbbf24", fontSize: 11, position: "top" }}
              />
            ))}
          </ComposedChart>
        </ResponsiveContainer>

        {/* ✅ RÉSUMÉ PATIENT ENRICHI AVEC NCA */}
        {patientPoint && (
          <div className="mt-6 space-y-4">
            {/* ✅ Afficher badge NCA si disponible */}
            {ncaPrediction && (
              <div className="p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm font-semibold text-blue-300">
                      Prédiction NCA active
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">Fiabilité</p>
                    <p className="text-sm font-bold text-blue-400">
                      {ncaPrediction.reliability} {ncaPrediction.reliability_stars}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-4 gap-3">
              <div className="p-3 bg-gray-800 rounded-lg">
                <p className="text-xs text-gray-400 mb-1">Âge actuel</p>
                <p className="text-xl font-bold text-white">{formatInteger(patientPoint.age)} ans</p>
              </div>

              <div className="p-3 bg-gray-800 rounded-lg">
                <p className="text-xs text-gray-400 mb-1">Delta NCA</p>
                <p className="text-xl font-bold text-orange-500">
                  {formatNumberWithSign(patientPoint.delta_nca, 1)} ans
                </p>
                {/* ✅ Afficher NCA prédit si disponible */}
                {ncaPrediction && (
                  <p className="text-xs text-gray-400 mt-1">
                    NCA: {formatNumber(ncaPrediction.nca_predicted, 1)} ans
                  </p>
                )}
              </div>

              <div className="p-3 bg-gray-800 rounded-lg">
                <p className="text-xs text-gray-400 mb-1">Zone actuelle</p>
                <p className={`text-lg font-bold ${
                  currentZone === "Normale" ? "text-green-400" :
                  currentZone === "MCI" ? "text-blue-400" : "text-red-400"
                }`}>
                  {currentZone}
                </p>
              </div>

              <div className="p-3 bg-gray-800 rounded-lg">
                <p className="text-xs text-gray-400 mb-1">Centile</p>
                <p className="text-xl font-bold text-blue-400">
                  {patientPoint.centile ? `${formatNumber(patientPoint.centile, 1)}e` : "—"}
                </p>
              </div>
            </div>

            {/* ✅ Complétude NCA si disponible */}
            {ncaPrediction && (
              <div className="p-3 bg-gray-800 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-gray-400">Complétude des données</p>
                  <p className="text-sm font-bold text-blue-400">
                    {ncaPrediction.features_used}/{ncaPrediction.features_total} champs
                  </p>
                </div>
                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${
                      ncaPrediction.completeness >= 90 ? 'bg-green-500' :
                      ncaPrediction.completeness >= 70 ? 'bg-blue-500' :
                      ncaPrediction.completeness >= 50 ? 'bg-yellow-500' : 'bg-orange-500'
                    }`}
                    style={{ width: `${ncaPrediction.completeness}%` }}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1 text-right">
                  {formatNumber(ncaPrediction.completeness, 0)}%
                </p>
              </div>
            )}

            {/* Trajectoire future */}
            {futureTrajectory.length > 0 && (
              <div className="p-4 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
                <p className="text-sm font-semibold text-yellow-300 mb-3">
                  📊 Projection future (5 ans)
                </p>
                <div className="grid grid-cols-5 gap-2 text-xs">
                  {futureTrajectory.map((point) => (
                    <div key={point.year} className="p-2 bg-gray-800 rounded text-center">
                      <p className="text-gray-400">+{point.year} an{point.year > 1 ? 's' : ''}</p>
                      <p className="text-white font-semibold text-sm">{formatInteger(point.age)} ans</p>
                      <p className={`text-xs font-bold mt-1 ${
                        point.zone === "Normale" ? "text-green-400" :
                        point.zone === "MCI" ? "text-blue-400" : "text-red-400"
                      }`}>
                        {point.zone || "—"}
                      </p>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-3">
                  {ncaPrediction 
                    ? "⚠️ Projection basée sur déclin estimé de +0.3 an/an (modèle NCA)"
                    : "⚠️ Projection basée sur delta constant (modèle simple)"
                  }
                </p>
              </div>
            )}

            {/* ✅ Interprétation NCA en priorité */}
            {(ncaPrediction?.interpretation || patientPoint.interpretation) && (
              <div className="p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                <p className="text-sm text-blue-300">
                  <span className="font-semibold">Interprétation :</span> {
                    ncaPrediction?.interpretation || patientPoint.interpretation
                  }
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}