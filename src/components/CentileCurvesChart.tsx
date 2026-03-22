// CentileCurvesChart.tsx
// Courbes de centiles pour delta_NCA (style CentileBrain / normative modelling)
// Multiple percentiles : 0.4, 2, 10, 25, 50, 75, 90, 98, 99.6

import React, { useMemo } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceDot,
} from "recharts";
import { ExtendedPredictionOutput } from "../types";

interface CentileCurvesChartProps {
  results: ExtendedPredictionOutput;
  height?: number;
}

// Configuration des centiles
const CENTILE_CONFIG = [
  { value: "0_4", centile: 0.4, color: "#8B4513", width: 1.5, dash: "5 5", label: "0.4e" },
  { value: "2", centile: 2, color: "#CD853F", width: 1.5, dash: "5 5", label: "2e" },
  { value: "10", centile: 10, color: "#4169E1", width: 2, dash: "3 3", label: "10e" },
  { value: "25", centile: 25, color: "#87CEEB", width: 2, dash: "3 3", label: "25e" },
  { value: "50", centile: 50, color: "#FFD700", width: 3, dash: undefined, label: "Médiane (50e)" },
  { value: "75", centile: 75, color: "#87CEEB", width: 2, dash: "3 3", label: "75e" },
  { value: "90", centile: 90, color: "#4169E1", width: 2, dash: "3 3", label: "90e" },
  { value: "98", centile: 98, color: "#CD853F", width: 1.5, dash: "5 5", label: "98e" },
  { value: "99_6", centile: 99.6, color: "#8B4513", width: 1.5, dash: "5 5", label: "99.6e" },
];

function useElementSize<T extends HTMLElement>() {
  const ref = React.useRef<T | null>(null);
  const [size, setSize] = React.useState({ width: 0, height: 0 });

  React.useEffect(() => {
    if (!ref.current) return;

    const ro = new ResizeObserver((entries) => {
      const cr = entries[0]?.contentRect;
      if (!cr) return;
      setSize({ width: cr.width, height: cr.height });
    });

    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);

  return { ref, size };
}

export function CentileCurvesChart({ results, height = 520 }: CentileCurvesChartProps) {
  if (!results?.centile_curves) {
    return <div className="text-gray-400 text-center p-8">Données de centiles non disponibles</div>;
  }

  const patientSex = results.centile_curves.patient_sex;
  const curvesData = (patientSex === 1
    ? results.centile_curves.male
    : results.centile_curves.female) || [];
  
  const rawData = results.centile_curves.raw_data || [];
  const patientPoint = results.centile_curves.patient_point || null;
  
  const sexLabel = patientSex === 1 ? "👨 Hommes" : "👩 Femmes";

  // Préparer les données pour Recharts
  const chartData = useMemo(() => {
    return curvesData.map((d: any) => {
      const row: any = { age: d.age };
      
      CENTILE_CONFIG.forEach(config => {
        const key = `p${config.value}`;
        if (d[key] !== undefined) {
          row[key] = d[key];
        }
      });
      
      return row;
    });
  }, [curvesData]);

  // Domaines X et Y
  const xDomain = useMemo<[number, number]>(() => {
    const ages = chartData.map(d => d.age).filter(a => Number.isFinite(a));
    if (!ages.length) return [50, 90];
    return [Math.min(...ages), Math.max(...ages)];
  }, [chartData]);

  const yDomain = useMemo<[number, number]>(() => {
    const values: number[] = [];
    
    chartData.forEach(d => {
      CENTILE_CONFIG.forEach(config => {
        const key = `p${config.value}`;
        if (d[key] !== undefined && Number.isFinite(d[key])) {
          values.push(d[key]);
        }
      });
    });
    
    rawData.forEach((d: any) => {
      if (d.value !== undefined && Number.isFinite(d.value)) {
        values.push(d.value);
      }
    });
    
    if (patientPoint && Number.isFinite(patientPoint.delta_nca)) {
      values.push(patientPoint.delta_nca);
    }
    
    if (!values.length) return [-15, 25];
    
    const minY = Math.min(...values);
    const maxY = Math.max(...values);
    return [Math.floor(minY - 2), Math.ceil(maxY + 2)];
  }, [chartData, rawData, patientPoint]);

  const { ref: containerRef, size } = useElementSize<HTMLDivElement>();
  const isReady = size.width > 5 && size.height > 5;

  if (!chartData.length) {
    return <div className="text-gray-400 text-center p-8">Pas assez de données pour générer les courbes</div>;
  }

  return (
    <div className="space-y-4">
      {/* Titre */}
      <div className="text-center mb-2">
        <h3 className="text-lg font-semibold text-white">Courbes de Centiles — {sexLabel}</h3>
        <p className="text-sm text-gray-400">Modélisation normative du vieillissement cognitif (Delta NCA)</p>
      </div>

      {/* Graphique */}
      <div
        ref={containerRef}
        className="w-full min-w-0 rounded-lg bg-gray-900"
        style={{ height, minWidth: 1, minHeight: 1 }}
      >
        {isReady ? (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart margin={{ top: 16, right: 30, left: 20, bottom: 50 }}>
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
                  offset: -12,
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
                  const data = payload[0]?.payload;

                  return (
                    <div className="bg-gray-900 p-3 rounded-lg border border-gray-700">
                      <p className="text-white font-semibold mb-2">Âge : {age} ans</p>
                      <div className="space-y-1 text-xs">
                        {CENTILE_CONFIG.filter(c => ["2", "10", "50", "90", "98"].includes(c.value)).map(config => {
                          const key = `p${config.value}`;
                          const value = data?.[key];
                          if (value === undefined) return null;
                          
                          return (
                            <p key={key} style={{ color: config.color }}>
                              {config.label} : {Number(value).toFixed(1)} ans
                            </p>
                          );
                        })}
                      </div>
                    </div>
                  );
                }}
              />

              {/* Points bruts (background) */}
              <Scatter
                data={rawData}
                dataKey="value"
                fill="#888888"
                fillOpacity={0.15}
                stroke="none"
                shape="circle"
                isAnimationActive={false}
              />

              {/* Courbes de centiles */}
              {CENTILE_CONFIG.map(config => {
                const key = `p${config.value}`;
                return (
                  <Line
                    key={key}
                    data={chartData}
                    dataKey={key}
                    stroke={config.color}
                    strokeWidth={config.width}
                    strokeDasharray={config.dash}
                    dot={false}
                    name={config.label}
                    isAnimationActive={false}
                    connectNulls
                  />
                );
              })}

              {/* Point patient */}
              {patientPoint && (
                <ReferenceDot
                  x={patientPoint.age}
                  y={patientPoint.delta_nca}
                  r={10}
                  fill="#ff6b00"
                  stroke="#ffffff"
                  strokeWidth={3}
                  label={{
                    value: "Patient",
                    position: "top",
                    fill: "#ff6b00",
                    fontSize: 12,
                    fontWeight: "bold",
                  }}
                />
              )}

              <Legend 
                iconType="line" 
                wrapperStyle={{ paddingTop: 20 }}
                formatter={(value: string) => (
                  <span style={{ color: '#9ca3af', fontSize: 11 }}>{value}</span>
                )}
              />
            </ComposedChart>
          </ResponsiveContainer>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-500 text-sm">
            Chargement du graphique…
          </div>
        )}
      </div>

      {/* Résumé position patient */}
      {patientPoint && (
        <>
          <div className="grid grid-cols-4 gap-3">
            <div className="p-3 bg-gray-800 rounded-lg">
              <p className="text-xs text-gray-400 mb-1">Âge</p>
              <p className="text-xl font-bold text-white">{Number(patientPoint.age).toFixed(0)} ans</p>
            </div>

            <div className="p-3 bg-gray-800 rounded-lg">
              <p className="text-xs text-gray-400 mb-1">Delta NCA</p>
              <p className="text-xl font-bold text-orange-500">
                {Number(patientPoint.delta_nca) > 0 ? "+" : ""}
                {Number(patientPoint.delta_nca).toFixed(1)} ans
              </p>
            </div>

            <div className="p-3 bg-gray-800 rounded-lg">
              <p className="text-xs text-gray-400 mb-1">Centile</p>
              <p className="text-xl font-bold text-blue-400">
                {patientPoint.centile?.toFixed(1) || "—"}e
              </p>
            </div>

            <div className="p-3 bg-gray-800 rounded-lg">
              <p className="text-xs text-gray-400 mb-1">Z-score</p>
              <p className="text-xl font-bold text-purple-400">
                {patientPoint.z_score?.toFixed(2) || "—"}
              </p>
            </div>
          </div>

          {patientPoint.interpretation && (
            <div className="p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
              <p className="text-sm text-blue-300">
                <span className="font-semibold">Interprétation :</span> {patientPoint.interpretation}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default CentileCurvesChart;