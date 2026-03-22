import React, { useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

interface GaugeChartProps {
  value: number; // 0-100
  title?: string;
}

export function GaugeChart({ value, title }: GaugeChartProps) {
  const safeValue = useMemo(() => {
    const v = Number.isFinite(value) ? value : 0;
    return Math.max(0, Math.min(100, v));
  }, [value]);

  const getColor = (val: number) => {
    if (val < 20) return "#22c55e";
    if (val < 40) return "#84cc16";
    if (val < 60) return "#eab308";
    if (val < 80) return "#f97316";
    return "#ef4444";
  };

  const color = getColor(safeValue);

  // Pour un demi-gauge propre, on garde 2 "parts"
  const data = [
    { name: "value", value: safeValue },
    { name: "remaining", value: 100 - safeValue },
  ];

  return (
    <div className="flex flex-col items-center min-w-0">
      {title && (
        <p className="text-sm text-gray-300 mb-2 text-center">{title}</p>
      )}

      {/* ✅ IMPORTANT: hauteur explicite + minWidth:0 */}
      <div className="w-full max-w-[260px] min-w-0" style={{ height: 180 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              cx="50%"
              cy="75%"              // ✅ descend le centre pour que le demi-cercle soit bien visible
              startAngle={180}
              endAngle={0}
              innerRadius="70%"
              outerRadius="95%"
              paddingAngle={0}
              isAnimationActive={false}
            >
              <Cell fill={color} />
              <Cell fill="#1f2937" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        {/* ✅ texte centré dans le demi-gauge */}
        <div className="pointer-events-none absolute" />
      </div>

      {/* Texte au centre (on le place sous le demi-cercle) */}
      <div className="-mt-16 flex flex-col items-center">
        <span className="text-4xl font-bold" style={{ color }}>
          {Math.round(safeValue)}%
        </span>

        <p className="mt-1 text-sm text-gray-400 text-center">
          {safeValue < 20 && "Très faible"}
          {safeValue >= 20 && safeValue < 40 && "Faible"}
          {safeValue >= 40 && safeValue < 60 && "Modéré"}
          {safeValue >= 60 && safeValue < 80 && "Élevé"}
          {safeValue >= 80 && "Très élevé"}
        </p>
      </div>

      {/* Barres de niveau */}
      <div className="mt-4 flex items-center gap-2">
        <div className="flex gap-1">
          {[0, 20, 40, 60, 80].map((threshold) => (
            <div
              key={threshold}
              className={`w-8 h-2 rounded-full transition-opacity ${
                safeValue >= threshold ? "opacity-100" : "opacity-30"
              }`}
              style={{ backgroundColor: getColor(threshold + 10) }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}