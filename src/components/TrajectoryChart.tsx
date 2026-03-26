import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExtendedPredictionOutput } from "../types";
import { ExplainableAI } from "./ExplainableAI";
import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceDot,
  ReferenceLine,
} from "recharts";

interface TrajectoryModuleProps {
  results: ExtendedPredictionOutput;
}

export function TrajectoryChart({ results }: TrajectoryModuleProps) {
  const currentAge = results.patient_age ?? results.nca_prediction?.age_chronologique ?? 65;
  const currentNCA = results.nca_prediction?.nca_predicted ?? currentAge;
  const deltaNCA = results.nca_prediction?.delta_nca ?? 0;

  const generateTrajectory = () => {
    const data = [];
    const yearsToProject = 10;

    const currentRate = deltaNCA > 0 ? deltaNCA / 5 : 0.5;
    const optimizedRate = currentRate * 0.4;

    for (let i = 0; i <= yearsToProject; i++) {
      const age = currentAge + i;

      // normal : ligne de référence âge = NCA (diagonale), part de currentAge
      // Ainsi la ligne pointillée EST distincte des trajectoires patient
      // qui partent de currentNCA (≥ currentAge quand deltaNCA > 0)
      const normalRef = currentAge + i;

      data.push({
        age,
        current: currentNCA + currentRate * i,
        optimized: currentNCA + optimizedRate * i,
        normal: normalRef,
        // Zone à risque : 5 ans AU-DESSUS de la ligne de référence, entières
        riskLower: normalRef + 5,
        riskBand: 30,
      });
    }

    return data;
  };

  const trajectoryData = generateTrajectory();

  // Domaine Y calculé sur les vraies lignes (ignore riskBand)
  // → évite que riskBand:30 compresse les courbes vers le bas
  const yMax = Math.ceil(
    Math.max(...trajectoryData.map(d => Math.max(d.current, d.normal, d.optimized))) + 8
  );

  // Ticks Y tous les 5 ans entre 40 et yMax (entiers, pas de virgule)
  const yTicks: number[] = [];
  for (let t = 40; t <= yMax; t += 5) yTicks.push(t);

  const calculateHealthEquityScore = () => {
    let score = 0;
    let factorsCount = 0;

    const r = results as any;
    if (r.living_alone === 1)  { score += 20; factorsCount++; }
    if (r.income === 0)        { score += 25; factorsCount++; }
    if (r.retired === 1)       { score += 15; factorsCount++; }

    return factorsCount > 0
      ? Math.round((score / factorsCount) * (100 / 60))
      : 0;
  };

  const healthEquityScore = calculateHealthEquityScore();

  // ── Tooltip personnalisé : masque riskLower et riskBand ─────────────────────
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload) return null;
    const filtered = payload.filter(
      (p: any) => p.dataKey !== "riskLower" && p.dataKey !== "riskBand"
    );
    if (!filtered.length) return null;
    return (
      <div style={{
        backgroundColor: "#1F2937",
        border: "1px solid #374151",
        borderRadius: "8px",
        padding: "10px 14px",
      }}>
        <p style={{ color: "#F3F4F6", marginBottom: 6, fontWeight: 600 }}>
          {label} ans
        </p>
        {filtered.map((entry: any, i: number) => (
          <p key={i} style={{ color: entry.color, margin: "2px 0", fontSize: 12 }}>
            {entry.name} : {Number(entry.value).toFixed(1)} ans
          </p>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">

      {/* ════════════════ EXPLAINABLE AI ════════════════ */}
      <ExplainableAI results={results} />

      {/* ════════════════ GRAPHIQUE ════════════════ */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-lg">Trajectoire projetée sur 10 ans</CardTitle>
        </CardHeader>

        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <ComposedChart
              data={trajectoryData}
              margin={{ top: 10, right: 30, left: 70, bottom: 50 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />

              <XAxis
                dataKey="age"
                stroke="#9CA3AF"
                tick={{ fill: "#6b7280", fontSize: 11 }}
                tickFormatter={(v: number) => String(Math.round(v))}
                label={{
                  value: "Âge (années)",
                  position: "insideBottom",
                  offset: -35,
                  fill: "#9CA3AF",
                  fontSize: 12,
                }}
              />

              <YAxis
                domain={[40, yMax]}
                allowDataOverflow={true}
                ticks={yTicks}
                stroke="#9CA3AF"
                tick={{ fill: "#6b7280", fontSize: 11 }}
                tickFormatter={(v: number) => String(Math.round(v))}
                label={{
                  value: "Âge neurocognitif (années)",
                  angle: -90,
                  position: "insideLeft",
                  dx: -55,
                  fill: "#9CA3AF",
                  fontSize: 12,
                }}
              />

              <Tooltip content={<CustomTooltip />} />

              <Legend
                verticalAlign="top"
                wrapperStyle={{ paddingBottom: "12px" }}
                formatter={(value) =>
                  value === "riskLower" || value === "riskBand" ? null : value
                }
              />

              {/* ── Bande diagonale zone à risque ─────────────────────────── */}
              {/* 1. Base transparente = ligne diagonale (normal = age) */}
              <Area
                type="monotone"
                dataKey="riskLower"
                stackId="risk"
                stroke="none"
                fill="transparent"
                dot={false}
                legendType="none"
                tooltipType="none"
                activeDot={false}
              />
              {/* 2. Bande empilée par-dessus → suit la diagonale */}
              <Area
                type="monotone"
                dataKey="riskBand"
                stackId="risk"
                stroke="#f87171"
                strokeWidth={0.5}
                strokeOpacity={0.4}
                fill="#FCA5A5"
                fillOpacity={0.13}
                dot={false}
                legendType="none"
                tooltipType="none"
                activeDot={false}
              />

              {/* Label "Zone à risque" — centré dans la bande rose */}
              <ReferenceLine
                y={currentAge + 5 + 2}
                stroke="none"
                label={{ value: "⚠ Zone à risque", position: "insideLeft", fill: "#f87171", fontSize: 10 }}
              />

              {/* ── Lignes ────────────────────────────────────────────────── */}
              <Line
                type="monotone"
                dataKey="normal"
                stroke="#6B7280"
                strokeDasharray="5 5"
                strokeWidth={2}
                dot={false}
                name="Vieillissement attendu"
              />

              <Line
                type="monotone"
                dataKey="current"
                stroke="#F97316"
                strokeWidth={3}
                dot={false}
                name="Trajectoire actuelle"
              />

              <Line
                type="monotone"
                dataKey="optimized"
                stroke="#22C55E"
                strokeWidth={3}
                dot={false}
                name="Trajectoire optimisée"
              />

              {/* ── Point patient ─────────────────────────────────────────── */}
              <ReferenceDot
                x={currentAge}
                y={currentNCA}
                r={6}
                fill="#3B82F6"
                stroke="#FFFFFF"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* ════════════════ RÉSUMÉ PROSPECTIF ════════════════ */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-lg">Résumé prospectif à 5 ans</CardTitle>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-gradient-to-br from-orange-900/20 to-orange-900/5 border border-orange-900 rounded-lg">
              <p className="text-xs text-orange-400 mb-1">Dans 5 ans (sans intervention)</p>
              <p className="text-2xl font-bold text-orange-500">
                {trajectoryData[5]?.current.toFixed(1)} ans
              </p>
              <p className="text-xs text-gray-400 mt-1">ANC prédit</p>
            </div>

            <div className="p-4 bg-gradient-to-br from-green-900/20 to-green-900/5 border border-green-900 rounded-lg">
              <p className="text-xs text-green-400 mb-1">Dans 5 ans (avec interventions)</p>
              <p className="text-2xl font-bold text-green-500">
                {trajectoryData[5]?.optimized.toFixed(1)} ans
              </p>
              <p className="text-xs text-gray-400 mt-1">ANC prédit</p>
            </div>

            <div className="p-4 bg-gradient-to-br from-purple-900/20 to-purple-900/5 border border-purple-900 rounded-lg">
              <p className="text-xs text-purple-400 mb-1">Années gagnées</p>
              <p className="text-2xl font-bold text-purple-500">
                {(trajectoryData[5]?.current - trajectoryData[5]?.optimized).toFixed(1)} ans
              </p>
              <p className="text-xs text-gray-400 mt-1">Bénéfice potentiel</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ════════════════ ALERTE ÉQUITÉ ════════════════ */}
      {healthEquityScore > 60 && (
        <Card className="bg-red-900/20 border-red-900">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-red-900/40 flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-red-400 mb-2">Alerte équité en santé</h3>
                <p className="text-sm text-red-300 mb-3">
                  Score d'équité en santé : <span className="font-bold">{healthEquityScore}%</span>
                </p>
                <p className="text-sm text-gray-300">
                  Envisager une orientation sociale en complément de la prise en charge neuropsychologique.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

    </div>
  );
}