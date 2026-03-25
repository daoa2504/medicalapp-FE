import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Line,
} from "recharts";
import { ExtendedPredictionOutput, ReferenceSubject } from "../types";
import {
  formatNumber,
  formatNumberWithSign,
  formatInteger,
} from "../utils/numberFormat";

interface ScatterPlotChartProps {
  results: ExtendedPredictionOutput;
}

type CustomStarProps = {
  cx?: number;
  cy?: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
};

const CustomStar = ({
  cx = 0,
  cy = 0,
  fill = "#3b82f6",
  stroke = "#ffffff",
  strokeWidth = 1,
}: CustomStarProps) => {
  const size = 12;

  const points = `
    ${cx},${cy - size}
    ${cx + size * 0.3},${cy - size * 0.3}
    ${cx + size},${cy - size * 0.3}
    ${cx + size * 0.45},${cy + size * 0.15}
    ${cx + size * 0.6},${cy + size}
    ${cx},${cy + size * 0.45}
    ${cx - size * 0.6},${cy + size}
    ${cx - size * 0.45},${cy + size * 0.15}
    ${cx - size},${cy - size * 0.3}
    ${cx - size * 0.3},${cy - size * 0.3}
  `;

  return (
    <polygon
      points={points}
      fill={fill}
      stroke={stroke}
      strokeWidth={strokeWidth}
    />
  );
};

export function ScatterPlotChart({ results }: ScatterPlotChartProps) {
  const [filters, setFilters] = useState({
    ageGroup: "all",
    sex: "all",
    education: "all",
    diagnosis: "all",
  });

  if (!results.nca_prediction) {
    return (
      <div className="p-4 bg-gray-800 rounded-lg text-center">
        <p className="text-gray-400">Prédiction NCA non disponible</p>
      </div>
    );
  }

  const patientAge = Number(results.nca_prediction.age_chronologique);
  const patientNCA = Number(results.nca_prediction.nca_predicted);
  // const patientDelta = Number(results.nca_prediction.delta_nca);

  const filteredCohort = (results.reference_cohort || []).filter(
    (subject: ReferenceSubject) => {
      if (filters.ageGroup !== "all") {
        if (filters.ageGroup === "<60" && subject.age >= 60) return false;
        if (
          filters.ageGroup === "60-80" &&
          (subject.age < 60 || subject.age > 80)
        ) {
          return false;
        }
        if (filters.ageGroup === ">80" && subject.age <= 80) return false;
      }

      if (filters.sex !== "all" && subject.sex !== Number(filters.sex)) {
        return false;
      }

      if (
        filters.education !== "all" &&
        subject.education_group !== Number(filters.education)
      ) {
        return false;
      }

      if (
        filters.diagnosis !== "all" &&
        subject.dementia_dx_code !== filters.diagnosis
      ) {
        return false;
      }

      return true;
    }
  );

  const scatterData = filteredCohort
    .filter((subject: ReferenceSubject) => {
      const age = Number(subject.age);
      const nca = Number(subject.neurocog_age_flu_weight);
      return !isNaN(age) && !isNaN(nca) && age > 0 && nca > 0;
    })
    .map((subject: ReferenceSubject) => ({
      age: Number(subject.age),
      nca: Number(subject.neurocog_age_flu_weight),
      diagnosis: subject.dementia_dx_code,
    }));

  const patientPoint = {
    age: patientAge,
    nca: patientNCA,
  };

  const diagnosisColors: Record<string, string> = {
    CON: "#22c55e",
    SCD: "#84cc16",
    MCI: "#eab308",
    AD: "#ef4444",
    OTHER_DEM: "#f97316",
  };

  return (
    <div className="space-y-4">
      {/* Bloc NCA */}
      <Card className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 border-blue-900/50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <svg
              className="w-6 h-6 text-blue-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>

            <div>
              <CardTitle className="text-xl">Âge Neurocognitif (NCA)</CardTitle>
              <p className="text-sm text-gray-400">
                Prédiction par modèle LightGBM avec gestion des données partielles
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-800/50 rounded-lg">
              <p className="text-xs text-gray-400 mb-2">Âge chronologique</p>
              <p className="text-3xl font-bold text-white">
                {formatNumber(results.nca_prediction.age_chronologique, 1)} ans
              </p>
            </div>

            <div className="text-center p-4 bg-blue-900/30 rounded-lg border-2 border-blue-500">
              <p className="text-xs text-gray-400 mb-2">NCA prédit</p>
              <p className="text-3xl font-bold text-blue-400">
                {formatNumber(results.nca_prediction.nca_predicted, 1)} ans
              </p>

              {results.nca_prediction.confidence_interval && (
                <div className="mt-3 pt-3 border-t border-blue-500/30">
                  <p className="text-xs text-blue-300">
                    IC 95% :{" "}
                    {formatNumber(
                      results.nca_prediction.confidence_interval.lower,
                      1
                    )}{" "}
                    -{" "}
                    {formatNumber(
                      results.nca_prediction.confidence_interval.upper,
                      1
                    )}{" "}
                    ans
                  </p>
                </div>
              )}
            </div>

            <div className="text-center p-4 bg-gray-800/50 rounded-lg">
              <p className="text-xs text-gray-400 mb-2">Delta NCA</p>
              <p
                className={`text-3xl font-bold ${
                  results.nca_prediction.delta_nca > 0
                    ? "text-orange-500"
                    : results.nca_prediction.delta_nca < 0
                    ? "text-green-500"
                    : "text-gray-400"
                }`}
              >
                {formatNumberWithSign(results.nca_prediction.delta_nca, 1)} ans
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-blue-900/20 rounded-lg border border-blue-500/30">
            {results.nca_prediction.delta_nca > 0 ? (
              <svg
                className="w-6 h-6 text-orange-500 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                />
              </svg>
            ) : (
              <svg
                className="w-6 h-6 text-green-500 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"
                />
              </svg>
            )}

            <div className="flex-1">
              <p className="font-semibold text-white">
                {results.nca_prediction.interpretation}
              </p>
              <p className="text-sm text-gray-400 mt-1">
                {results.nca_prediction.delta_nca > 0
                  ? `Le cerveau vieillit ${Math.abs(
                      results.nca_prediction.delta_nca
                    ).toFixed(1)} ans plus vite que le corps`
                  : results.nca_prediction.delta_nca < 0
                  ? `Le cerveau vieillit ${Math.abs(
                      results.nca_prediction.delta_nca
                    ).toFixed(1)} ans moins vite que le corps`
                  : `Le cerveau vieillit au même rythme que le corps`}
              </p>
            </div>
          </div>

          <div className="p-3 bg-gray-800/50 rounded-lg border border-gray-700">
            <p className="text-xs text-gray-400">
              <strong className="text-gray-300">Modèle :</strong> LightGBM avec
              gestion native des valeurs manquantes (NaN)
              <strong className="text-gray-300 ml-2">• MAE :</strong> ~5.1 ans
              <strong className="text-gray-300 ml-2">• R² :</strong> 0.71-0.73
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Filtres */}
      <div className="flex flex-wrap gap-4 p-4 bg-gray-800 rounded-lg">
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-400">Âge :</label>
          <select
            value={filters.ageGroup}
            onChange={(e) =>
              setFilters({ ...filters, ageGroup: e.target.value })
            }
            className="bg-gray-700 text-white px-3 py-1 rounded text-sm"
          >
            <option value="all">Tous âges</option>
            <option value="<60">&lt; 60 ans</option>
            <option value="60-80">60-80 ans</option>
            <option value=">80">&gt; 80 ans</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-400">Sexe :</label>
          <select
            value={filters.sex}
            onChange={(e) => setFilters({ ...filters, sex: e.target.value })}
            className="bg-gray-700 text-white px-3 py-1 rounded text-sm"
          >
            <option value="all">Tous</option>
            <option value="0">Femme</option>
            <option value="1">Homme</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-400">Diagnostic :</label>
          <select
            value={filters.diagnosis}
            onChange={(e) =>
              setFilters({ ...filters, diagnosis: e.target.value })
            }
            className="bg-gray-700 text-white px-3 py-1 rounded text-sm"
          >
            <option value="all">Tous</option>
            <option value="CON">Non atteint (CON)</option>
            <option value="SCD">Déclin subjectif (SCD)</option>
            <option value="MCI">Trouble léger (MCI)</option>
            <option value="AD">Alzheimer (AD)</option>
            <option value="OTHER_DEM">Autres démences</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-400">Éducation :</label>
          <select
            value={filters.education}
            onChange={(e) =>
              setFilters({ ...filters, education: e.target.value })
            }
            className="bg-gray-700 text-white px-3 py-1 rounded text-sm"
          >
            <option value="all">Tous niveaux</option>
            <option value="0">Secondaire (ou inférieur au DES)</option>
            <option value="1">Collégial / Technique</option>
            <option value="2">Universitaire (1er cycle)</option>
            <option value="3">Universitaire (cycles supérieurs)</option>
          </select>
        </div>
      </div>

      <div className="text-sm text-gray-400 text-center">
        Affichage de {scatterData.length} participants sur{" "}
        {results.reference_cohort?.length || 0}
      </div>

      {/* Graphique */}
      <ResponsiveContainer width="100%" height={500}>
        <ScatterChart margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />

          <XAxis
            type="number"
            dataKey="age"
            name="Âge chronologique"
            stroke="#9ca3af"
            domain={[50, 90]}
            label={{
              value: "Âge chronologique (années)",
              position: "insideBottom",
              offset: -10,
              fill: "#9ca3af",
            }}
          />

          <YAxis
            type="number"
            dataKey="nca"
            name="Âge neurocognitif"
            stroke="#9ca3af"
            domain={[40, 100]}
            label={{
              value: "Âge neurocognitif (années)",
              angle: -90,
              position: "insideLeft",
              fill: "#9ca3af",
            }}
          />

          <Tooltip
            contentStyle={{
              backgroundColor: "#1f2937",
              border: "1px solid #374151",
              borderRadius: "8px",
              color: "#fff",
            }}
            cursor={{ strokeDasharray: "3 3" }}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload;
                return (
                  <div className="bg-gray-900 p-3 rounded-lg border border-gray-700">
                    <p className="text-sm text-gray-400">
                      Âge chronologique : {formatInteger(data?.age)} ans
                    </p>
                    <p className="text-sm text-gray-400">
                      Âge neurocognitif : {formatNumber(data?.nca, 1)} ans
                    </p>
                    {data.diagnosis && (
                      <p className="text-sm text-gray-400">
                        Diagnostic : {data.diagnosis}
                      </p>
                    )}
                  </div>
                );
              }
              return null;
            }}
          />

          <Legend wrapperStyle={{ paddingTop: "20px" }} iconType="circle" />

          <Line
            type="monotone"
            dataKey="nca"
            data={[
              { age: 40, nca: 40 },
              { age: 100, nca: 100 },
            ]}
            stroke="#6b7280"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={false}
            name="Ligne de référence (âge = NCA)"
          />

          {Object.keys(diagnosisColors).map((dx) => {
            const dxData = scatterData.filter((d) => d.diagnosis === dx);
            if (dxData.length === 0) return null;

            return (
              <Scatter
                key={dx}
                name={dx}
                data={dxData}
                fill={diagnosisColors[dx]}
                opacity={0.6}
                isAnimationActive={false}
              />
            );
          })}

          <Scatter
            name="Patient actuel"
            data={[patientPoint]}
            fill="#3b82f6"
            stroke="#fff"
            strokeWidth={1}
            shape={(props) => <CustomStar {...props} />}
            isAnimationActive={false}
          />
        </ScatterChart>
      </ResponsiveContainer>

      {/* Légende */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span className="text-gray-400">CON - Non atteint</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-lime-500" />
          <span className="text-gray-400">SCD - Déclin subjectif</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-yellow-500" />
          <span className="text-gray-400">MCI - Trouble léger</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span className="text-gray-400">AD - Alzheimer</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-orange-500" />
          <span className="text-gray-400">OTHER - Autres démences</span>
        </div>

        <div className="flex items-center gap-2">
          <svg
            className="w-4 h-4 text-blue-500"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
          <span className="text-gray-400">Votre patient</span>
        </div>
      </div>
    </div>
  );
}