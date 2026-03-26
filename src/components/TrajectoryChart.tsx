import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExtendedPredictionOutput } from "../types";
import { ExplainableAI } from "./ExplainableAI";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceDot,
  ReferenceArea,
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

      data.push({
        age,
        current: currentNCA + currentRate * i,
        optimized: currentNCA + optimizedRate * i,
        normal: age,
      });
    }

    return data;
  };

  const trajectoryData = generateTrajectory();

  const calculateHealthEquityScore = () => {
    let score = 0;
    let factorsCount = 0;

    const socialFactors = {
      living_alone: 1,
      income: 0,
      retired: 1,
    };

    if (socialFactors.living_alone === 1) {
      score += 20;
      factorsCount++;
    }
    if (socialFactors.income === 0) {
      score += 25;
      factorsCount++;
    }
    if (socialFactors.retired === 1) {
      score += 15;
      factorsCount++;
    }

    return factorsCount > 0
      ? Math.round((score / factorsCount) * (100 / 60))
      : 0;
  };

  const healthEquityScore = calculateHealthEquityScore();

  return (
    <div className="space-y-6">
      {/* Graphique principal */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-lg">
            Trajectoire projetée sur 10 ans
          </CardTitle>
        </CardHeader>

        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart
              data={trajectoryData}
              margin={{ top: 10, right: 30, left: 70, bottom: 50 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />

              {/* ── Axe X : débute à 40, ticks tous les 5 ans ─────────────── */}
              <XAxis
                dataKey="age"
                stroke="#9CA3AF"
                tick={{ fill: "#6b7280", fontSize: 11 }}
                label={{
                  value: "Âge (années)",
                  position: "insideBottom",
                  offset: -35,
                  fill: "#9CA3AF",
                  fontSize: 12,
                }}
              />

              {/* ── Axe Y : label décalé à gauche pour éviter chevauchement ─ */}
              <YAxis
                domain={[40, "auto"]}
                stroke="#9CA3AF"
                tick={{ fill: "#6b7280", fontSize: 11 }}
                label={{
                  value: "Âge neurocognitif (années)",
                  angle: -90,
                  position: "insideLeft",
                  dx: -55,
                  fill: "#9CA3AF",
                  fontSize: 12,
                }}
              />

              <Tooltip
                contentStyle={{
                  backgroundColor: "#1F2937",
                  border: "1px solid #374151",
                  borderRadius: "8px",
                }}
                labelStyle={{ color: "#F3F4F6" }}
                formatter={(value: number | undefined) => [
                  value != null ? `${Number(value).toFixed(1)} ans` : "—",
                  undefined,
                ]}
              />

              <Legend verticalAlign="top" wrapperStyle={{ paddingBottom: "12px" }} />

              {/* ── Zone à risque : de currentNCA (position actuelle) jusqu'au ─
                   max projeté en 10 ans sans intervention ─────────────────── */}
              <ReferenceArea
                y1={currentNCA}
                y2={trajectoryData[trajectoryData.length - 1]?.current ?? currentNCA + 20}
                fill="#EF4444"
                fillOpacity={0.07}
                label={{
                  value: "Zone à risque",
                  position: "insideTopLeft",
                  fill: "#f87171",
                  fontSize: 11,
                }}
              />

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

              <ReferenceDot
                x={currentAge}
                y={currentNCA}
                r={6}
                fill="#3B82F6"
                stroke="#FFFFFF"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Résumé prospectif */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-lg">
            Résumé prospectif à 5 ans
          </CardTitle>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-gradient-to-br from-orange-900/20 to-orange-900/5 border border-orange-900 rounded-lg">
              <p className="text-xs text-orange-400 mb-1">
                Dans 5 ans (sans intervention)
              </p>
              <p className="text-2xl font-bold text-orange-500">
                {trajectoryData[5]?.current.toFixed(1)} ans
              </p>
              <p className="text-xs text-gray-400 mt-1">
                ANC prédit
              </p>
            </div>

            <div className="p-4 bg-gradient-to-br from-green-900/20 to-green-900/5 border border-green-900 rounded-lg">
              <p className="text-xs text-green-400 mb-1">
                Dans 5 ans (avec interventions)
              </p>
              <p className="text-2xl font-bold text-green-500">
                {trajectoryData[5]?.optimized.toFixed(1)} ans
              </p>
              <p className="text-xs text-gray-400 mt-1">
                ANC prédit
              </p>
            </div>

            <div className="p-4 bg-gradient-to-br from-purple-900/20 to-purple-900/5 border border-purple-900 rounded-lg">
              <p className="text-xs text-purple-400 mb-1">
                Années gagnées
              </p>
              <p className="text-2xl font-bold text-purple-500">
                {(trajectoryData[5]?.current - trajectoryData[5]?.optimized).toFixed(1)} ans
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Bénéfice potentiel
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Équité en santé */}
      {healthEquityScore > 60 && (
        <Card className="bg-red-900/20 border-red-900">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-red-900/40 flex items-center justify-center flex-shrink-0">
                <svg
                  className="w-6 h-6 text-red-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>

              <div className="flex-1">
                <h3 className="font-semibold text-red-400 mb-2">
                  Alerte équité en santé
                </h3>

                <p className="text-sm text-red-300 mb-3">
                  Score d’équité en santé :
                  <span className="font-bold"> {healthEquityScore}%</span>
                </p>

                <p className="text-sm text-gray-300">
                  Envisager une orientation sociale en complément de la prise en
                  charge neuropsychologique.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
          <ExplainableAI results={results} />  
    </div>
  );
}