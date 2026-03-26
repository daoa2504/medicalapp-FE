import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { RiskGauges } from './RiskGauges';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { ExtendedPredictionOutput, ReferenceSubject } from "../types";
import {
  formatNumber,
  formatNumberWithSign,
  formatInteger,
} from "../utils/numberFormat";

// ─── Props ────────────────────────────────────────────────────────────────────

interface ScatterPlotChartProps {
  results: ExtendedPredictionOutput;
}

// ─── Étoile patient ───────────────────────────────────────────────────────────

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
  strokeWidth = 1.5,
}: CustomStarProps) => {
  const size = 13;
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

// ─── Couleurs diagnostic ──────────────────────────────────────────────────────

const DIAGNOSIS_COLORS: Record<string, string> = {
  CON: "#22c55e",
  SCD: "#84cc16",
  MCI: "#eab308",
  AD: "#ef4444",
  OTHER_DEM: "#f97316",
};

const DIAGNOSIS_LABELS: Record<string, string> = {
  CON: "Non atteint (CON)",
  SCD: "Déclin subjectif (SCD)",
  MCI: "Trouble léger (MCI)",
  AD: "Alzheimer (AD)",
  OTHER_DEM: "Autres démences",
};

// ─── Composant principal ──────────────────────────────────────────────────────

export function ScatterPlotChart({ results }: ScatterPlotChartProps) {

  // ── Filtres ──────────────────────────────────────────────────────────────
  const [filters, setFilters] = useState({
    ageGroup: "all",
    sex: "all",
    education: "all",
    diagnosis: "all",
  });

  // ── Calcul alerte facteurs modifiables ───────────────────────────────────
  const NON_MODIFIABLE = new Set([
    "hist_demence_fam",
    "hist_demence_parent",
    "stroke",
    "tbi",
    "living_alone",
    "retired",
  ]);

  const ALL_RISK_FACTORS = [
    "hist_demence_fam", "hist_demence_parent", "living_alone", "income", "retired",
    "stroke", "tbi", "hta", "diab_type2", "chol_total",
    "obesity", "depression", "anxiety",
    "smoking", "alcohol", "poly_pharm5", "physical_activity", "social_life",
    "cognitive_activities", "nutrition_score", "sleep_deprivation",
  ];

  // Facteurs dont 0 = risque présent (valeurs protectrices codées en 1)
  const INVERTED_FACTORS = new Set([
    "income", "physical_activity", "social_life",
    "cognitive_activities", "nutrition_score",
  ]);

  const modifiableFactors = ALL_RISK_FACTORS.filter((f) => !NON_MODIFIABLE.has(f));

  const calculateModifiableRiskScore = () => {
    let score = 0;
    modifiableFactors.forEach((factor) => {
      const value = (results as any)[factor];
      if (value === undefined || value === null) return;
      if (INVERTED_FACTORS.has(factor)) {
        if (value === 0) score++;
      } else {
        if (value === 1 || value > 0) score++;
      }
    });
    return { score, total: modifiableFactors.length };
  };

  const modifiableRiskData = calculateModifiableRiskScore();

  // ── Alerte équité ────────────────────────────────────────────────────────
  const showEquityAlert =
    (results as any).income === 0 || (results as any).social_life === 0;

  // ── Garde : NCA non disponible ───────────────────────────────────────────
  if (!results.nca_prediction) {
    return (
      <div className="flex items-center justify-center p-8 bg-gray-800/50 rounded-xl border border-gray-700">
        <p className="text-gray-400">Prédiction NCA non disponible</p>
      </div>
    );
  }

  const nca = results.nca_prediction;
  const patientAge = Number(nca.age_chronologique);
  const patientNCA = Number(nca.nca_predicted);
  const delta = Number(nca.delta_nca);
  const isAccelerated = delta > 0;
  const isNormal = Math.abs(delta) < 2;

  // ── Risque démence ────────────────────────────────────────────────────────
  const riskDementia = results.risk_scores?.risk_dementia ?? 0;

  // ── Filtrage cohorte ─────────────────────────────────────────────────────
  const filteredCohort = (results.reference_cohort || []).filter(
    (s: ReferenceSubject) => {
      if (filters.ageGroup === "<60" && s.age >= 60) return false;
      if (filters.ageGroup === "60-80" && (s.age < 60 || s.age > 80)) return false;
      if (filters.ageGroup === ">80" && s.age <= 80) return false;
      if (filters.sex !== "all" && s.sex !== Number(filters.sex)) return false;
      if (filters.education !== "all" && s.education_group !== Number(filters.education)) return false;
      if (filters.diagnosis !== "all" && s.dementia_dx_code !== filters.diagnosis) return false;
      return true;
    }
  );

  const scatterData = filteredCohort
    .filter((s: ReferenceSubject) => {
      const age = Number(s.age);
      const nca = Number(s.neurocog_age_flu_weight);
      return !isNaN(age) && !isNaN(nca) && age > 0 && nca > 0;
    })
    .map((s: ReferenceSubject) => ({
      age: Number(s.age),
      nca: Number(s.neurocog_age_flu_weight),
      diagnosis: s.dementia_dx_code,
    }));

  const patientPoint = { age: patientAge, nca: patientNCA };

  // ── Complétude & fiabilité ───────────────────────────────────────────────
  const completeness = nca.completeness ?? 0;
  const reliability = nca.reliability ?? "—";
  const reliabilityStars = nca.reliability_stars ?? "";

  const completenessColor =
    completeness >= 90 ? "bg-green-500" :
    completeness >= 70 ? "bg-yellow-500" :
    completeness >= 50 ? "bg-orange-500" : "bg-red-500";

  // ── IC ───────────────────────────────────────────────────────────────────
  const ci = nca.confidence_interval;

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">

      {/* ════════════════ CARTE NCA ════════════════ */}
      <Card className="bg-gradient-to-br from-blue-950/40 to-purple-950/40 border-blue-800/40">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div>
              <CardTitle className="text-lg text-white">Âge Neurocognitif (NCA)</CardTitle>
              <p className="text-xs text-gray-400 mt-0.5">LightGBM · gestion native des données partielles</p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-5">

          {/* Trois métriques */}
          <div className="grid grid-cols-3 gap-3">

            {/* Âge chronologique */}
            <div className="text-center p-4 bg-gray-800/60 rounded-xl border border-gray-700/50">
              <p className="text-xs text-gray-400 mb-1 uppercase tracking-wide">Âge réel</p>
              <p className="text-3xl font-bold text-white tabular-nums">
                {formatNumber(patientAge, 0)}
              </p>
              <p className="text-xs text-gray-500 mt-1">ans</p>
            </div>

            {/* NCA prédit */}
            <div className="text-center p-4 bg-blue-900/30 rounded-xl border-2 border-blue-500/60">
              <p className="text-xs text-blue-300 mb-1 uppercase tracking-wide">NCA prédit</p>
              <p className="text-3xl font-bold text-blue-300 tabular-nums">
                {formatNumber(patientNCA, 1)}
              </p>
              <p className="text-xs text-blue-400/70 mt-1">ans</p>
              {ci && (
                <p className="text-xs text-blue-400/80 mt-2 pt-2 border-t border-blue-500/20">
                  IC : {formatNumber(ci.lower, 1)} – {formatNumber(ci.upper, 1)} ans
                </p>
              )}
            </div>

            {/* Delta NCA */}
            <div className={`text-center p-4 rounded-xl border-2 ${
              isNormal
                ? "bg-gray-800/60 border-gray-600/60"
                : isAccelerated
                ? "bg-red-900/30 border-red-500/70 shadow-[0_0_12px_rgba(239,68,68,0.25)]"
                : "bg-green-900/30 border-green-500/70 shadow-[0_0_12px_rgba(34,197,94,0.25)]"
            }`}>
              <p className="text-xs text-gray-400 mb-1 uppercase tracking-wide">Δ NCA</p>
              <p className={`text-3xl font-bold tabular-nums ${
                isNormal ? "text-gray-300" : isAccelerated ? "text-red-400" : "text-green-400"
              }`}>
                {formatNumberWithSign(delta, 1)}
              </p>
              <p className="text-xs text-gray-500 mt-1">ans</p>
              {/* Badge indicateur */}
              <div className={`mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                isNormal
                  ? "bg-gray-700/60 text-gray-400"
                  : isAccelerated
                  ? "bg-red-900/60 text-red-300"
                  : "bg-green-900/60 text-green-300"
              }`}>
                {isNormal ? "Normal" : isAccelerated ? "⚠ Accéléré" : "✓ Ralenti"}
              </div>
            </div>
          </div>

          {/* Barre IC */}
          {ci && (
            <div className="p-3 bg-gray-800/40 rounded-lg border border-gray-700/40">
              <div className="flex justify-between text-xs text-gray-400 mb-2">
                <span>IC {Math.round((ci.confidence_level ?? 0.95) * 100)}% — plage de prédiction</span>
                <span>{formatNumber(ci.lower, 1)} – {formatNumber(ci.upper, 1)} ans</span>
              </div>
              <div className="relative h-3 bg-gray-700 rounded-full overflow-hidden">
                {/* Plage IC */}
                <div
                  className="absolute h-full bg-blue-500/30 rounded-full"
                  style={{
                    left: `${Math.max(0, ((ci.lower - 40) / 60) * 100)}%`,
                    right: `${Math.max(0, 100 - ((ci.upper - 40) / 60) * 100)}%`,
                  }}
                />
                {/* Valeur NCA */}
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-blue-400 rounded-full border-2 border-white shadow"
                  style={{ left: `calc(${Math.max(0, Math.min(100, ((patientNCA - 40) / 60) * 100))}% - 6px)` }}
                />
              </div>
            </div>
          )}

          {/* Interprétation */}
          <div className={`flex items-center gap-3 p-4 rounded-xl border ${
            isNormal
              ? "bg-gray-800/40 border-gray-700/40"
              : isAccelerated
              ? "bg-red-900/15 border-red-700/30"
              : "bg-green-900/15 border-green-700/30"
          }`}>
            <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
              isNormal ? "bg-gray-700" : isAccelerated ? "bg-red-500/20" : "bg-green-500/20"
            }`}>
              {isNormal ? (
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
                </svg>
              ) : isAccelerated ? (
                <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                </svg>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`font-semibold text-sm ${
                isNormal ? "text-gray-200" : isAccelerated ? "text-red-300" : "text-green-300"
              }`}>
                {nca.interpretation}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {isNormal
                  ? "Le cerveau vieillit au même rythme que le corps"
                  : isAccelerated
                  ? `Le cerveau vieillit ${Math.abs(delta).toFixed(1)} ans plus vite que le corps`
                  : `Le cerveau vieillit ${Math.abs(delta).toFixed(1)} ans moins vite que le corps`
                }
              </p>
            </div>
          </div>

          {/* Fiabilité & complétude */}
          <div className="flex items-center gap-4 p-3 bg-gray-800/40 rounded-lg border border-gray-700/40">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-gray-400">Complétude des données</span>
                <span className="text-xs font-medium text-gray-300">
                  {nca.features_used}/{nca.features_total} · {formatNumber(completeness, 0)}%
                </span>
              </div>
              <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${completenessColor}`}
                  style={{ width: `${Math.min(100, completeness)}%` }}
                />
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-sm">{reliabilityStars}</p>
              <p className="text-xs text-gray-400">{reliability}</p>
            </div>
          </div>

          {/* Stats modèle */}
          <div className="flex flex-wrap gap-3 text-xs text-gray-500">
            <span><span className="text-gray-400 font-medium">Modèle :</span> LGBM_with_nan</span>
            <span>·</span>
            <span><span className="text-gray-400 font-medium">MAE test :</span> ~2.8 ans</span>
            <span>·</span>
            <span><span className="text-gray-400 font-medium">R² :</span> 0.897</span>
            <span>·</span>
            <span><span className="text-gray-400 font-medium">N entraînement :</span> 848 patients</span>
          </div>

        </CardContent>
      </Card>

      {/* ════════════════ ALERTE : FACTEURS DE RISQUE MODIFIABLES ════════════ */}
      {modifiableRiskData.score >= 2 && (
        <Card className="bg-orange-950/20 border-orange-800/50">
          <CardContent className="pt-5">
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-xl bg-orange-900/40 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <h3 className="text-sm font-semibold text-orange-300">Alerte — Facteurs de risque modifiables</h3>
                  <span className="px-2 py-0.5 bg-orange-900/50 border border-orange-700/50 rounded-full text-xs text-orange-300 font-bold">
                    {modifiableRiskData.score}/{modifiableRiskData.total}
                  </span>
                </div>
                <p className="text-xs text-gray-300 leading-relaxed">
                  Chaque facteur modifiable coché agit comme un{" "}
                  <span className="text-orange-300 font-medium">agresseur sur le cerveau</span>.
                  Ce risque est amplifié par le terrain de vulnérabilité identifié.
                  L'accumulation de ces facteurs accélère l'épuisement de la réserve cognitive.
                  Considérez un plan d'intervention visant la{" "}
                  <span className="text-orange-300 font-medium">réduction combinée</span> de ces risques.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ════════════════ ALERTE : ÉQUITÉ EN SANTÉ ════════════════ */}
      {showEquityAlert && (
        <Card className="bg-red-950/20 border-red-800/50">
          <CardContent className="pt-5">
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-xl bg-red-900/40 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd"
                    d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                    clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-red-300 mb-1.5">Alerte — Équité en santé</h3>
                <p className="text-xs text-gray-300 leading-relaxed mb-3">
                  Envisager une orientation sociale en complément de la prise en charge neuropsychologique.
                </p>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    Considérer l'intersectionnalité des facteurs socio-économiques
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Ressources : Travailleur social, Services communautaires
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ════════════════ JAUGES DE RISQUE ════════════════ */}
      <RiskGauges riskDementia={riskDementia} />

      {/* ════════════════ FILTRES ════════════════ */}
      <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-4">
        <p className="text-xs text-gray-500 uppercase tracking-wide mb-3 font-medium">Filtrer la cohorte</p>
        <div className="flex flex-wrap gap-3">
          {[
            {
              label: "Âge", key: "ageGroup",
              options: [
                { value: "all", label: "Tous âges" },
                { value: "<60", label: "< 60 ans" },
                { value: "60-80", label: "60–80 ans" },
                { value: ">80", label: "> 80 ans" },
              ],
            },
            {
              label: "Sexe", key: "sex",
              options: [
                { value: "all", label: "Tous" },
                { value: "0", label: "Femme" },
                { value: "1", label: "Homme" },
              ],
            },
            {
              label: "Diagnostic", key: "diagnosis",
              options: [
                { value: "all", label: "Tous" },
                { value: "CON", label: "CON" },
                { value: "SCD", label: "SCD" },
                { value: "MCI", label: "MCI" },
                { value: "AD", label: "AD" },
                { value: "OTHER_DEM", label: "Autres" },
              ],
            },
            {
              label: "Éducation", key: "education",
              options: [
                { value: "all", label: "Tous niveaux" },
                { value: "0", label: "Secondaire" },
                { value: "1", label: "Collégial" },
                { value: "2", label: "Universitaire 1er" },
                { value: "3", label: "Universitaire sup." },
              ],
            },
          ].map(({ label, key, options }) => (
            <div key={key} className="flex items-center gap-2">
              <label className="text-xs text-gray-400 whitespace-nowrap">{label} :</label>
              <select
                value={filters[key as keyof typeof filters]}
                onChange={(e) => setFilters({ ...filters, [key]: e.target.value })}
                className="bg-gray-800 text-white border border-gray-700 px-2.5 py-1.5 rounded-lg text-xs focus:outline-none focus:border-blue-500 transition-colors"
              >
                {options.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-600 mt-3">
          {scatterData.length} participant{scatterData.length > 1 ? "s" : ""} affiché{scatterData.length > 1 ? "s" : ""}
          {" "}sur {results.reference_cohort?.length ?? 0} au total
        </p>
      </div>

      {/* ════════════════ GRAPHIQUE ════════════════ */}
      <Card className="bg-gray-900/60 border-gray-800">
        <CardContent className="pt-4">
          <ResponsiveContainer width="100%" height={480}>
            <ScatterChart margin={{ top: 20, right: 30, left: 10, bottom: 55 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />

              <XAxis
                type="number"
                dataKey="age"
                name="Âge chronologique"
                stroke="#4b5563"
                tick={{ fill: "#6b7280", fontSize: 11 }}
                domain={[50, 90]}
                ticks={[50, 55, 60, 65, 70, 75, 80, 85, 90]}
                tickFormatter={(v: number) => String(Math.round(v))}
                allowDataOverflow
                label={{
                  value: "Âge chronologique (années)",
                  position: "insideBottom",
                  offset: -30,
                  fill: "#6b7280",
                  fontSize: 12,
                }}
              />

              <YAxis
                type="number"
                dataKey="nca"
                name="Âge neurocognitif"
                stroke="#4b5563"
                tick={{ fill: "#6b7280", fontSize: 11 }}
                domain={[40, 110]}
                label={{
                  value: "Âge neurocognitif (années)",
                  angle: -90,
                  position: "insideLeft",
                  offset: 10,
                  fill: "#6b7280",
                  fontSize: 12,
                }}
              />

              {/* Ligne diagonale de référence (âge = NCA) */}
              <ReferenceLine
                segment={[{ x: 50, y: 50 }, { x: 90, y: 90 }]}
                stroke="#4b5563"
                strokeDasharray="6 4"
                strokeWidth={1.5}
                label={{ value: "âge = NCA", position: "insideTopLeft", fill: "#6b7280", fontSize: 10 }}
              />

              <Tooltip
                cursor={{ strokeDasharray: "3 3", stroke: "#374151" }}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0].payload;
                  const dxLabel = d.diagnosis ? DIAGNOSIS_LABELS[d.diagnosis] ?? d.diagnosis : null;
                  const dxColor = d.diagnosis ? DIAGNOSIS_COLORS[d.diagnosis] ?? "#9ca3af" : "#3b82f6";
                  return (
                    <div className="bg-gray-900 border border-gray-700 rounded-xl p-3 shadow-xl text-xs space-y-1">
                      {dxLabel && (
                        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-700">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: dxColor }} />
                          <span className="text-gray-300 font-medium">{dxLabel}</span>
                        </div>
                      )}
                      <p className="text-gray-400">
                        Âge : <span className="text-white font-medium">{formatInteger(d.age)} ans</span>
                      </p>
                      <p className="text-gray-400">
                        NCA : <span className="text-white font-medium">{formatNumber(d.nca, 1)} ans</span>
                      </p>
                      {d.age && d.nca && (
                        <p className="text-gray-400">
                          Δ : <span className={`font-medium ${d.nca - d.age > 0 ? "text-orange-400" : "text-green-400"}`}>
                            {formatNumberWithSign(d.nca - d.age, 1)} ans
                          </span>
                        </p>
                      )}
                    </div>
                  );
                }}
              />

              {/* Points cohorte par diagnostic */}
              {Object.keys(DIAGNOSIS_COLORS).map((dx) => {
                const dxData = scatterData.filter((d) => d.diagnosis === dx);
                if (dxData.length === 0) return null;
                return (
                  <Scatter
                    key={dx}
                    name={dx}
                    data={dxData}
                    fill={DIAGNOSIS_COLORS[dx]}
                    opacity={0.55}
                    isAnimationActive={false}
                  />
                );
              })}

              {/* Point patient */}
              <Scatter
                name="Patient actuel"
                data={[patientPoint]}
                fill="#3b82f6"
                stroke="#ffffff"
                strokeWidth={1.5}
                shape={(props) => <CustomStar {...props} />}
                isAnimationActive={false}
              />
            </ScatterChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* ════════════════ LÉGENDE ════════════════ */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 px-1">
        {Object.entries(DIAGNOSIS_LABELS).map(([dx, label]) => (
          <div key={dx} className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: DIAGNOSIS_COLORS[dx] }} />
            <span className="text-xs text-gray-400">{label}</span>
          </div>
        ))}
        <div className="flex items-center gap-2">
          <svg className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
          <span className="text-xs text-gray-400">Patient actuel</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-0.5 border-t-2 border-dashed border-gray-600 flex-shrink-0" />
          <span className="text-xs text-gray-500">âge = NCA</span>
        </div>
      </div>

    </div>
  );
}