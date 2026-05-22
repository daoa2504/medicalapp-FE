import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExtendedPredictionOutput } from "../types";
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
} from "recharts";

interface CentileChartProps {
  results: ExtendedPredictionOutput;
}

/**
 * Calcule les centiles d'un tableau de valeurs.
 */
function quantile(arr: number[], q: number): number | null {
  if (arr.length === 0) return null;
  const sorted = [...arr].sort((a, b) => a - b);
  const pos = (sorted.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  if (sorted[base + 1] !== undefined) {
    return sorted[base] + rest * (sorted[base + 1] - sorted[base]);
  } else {
    return sorted[base];
  }
}

/**
 * Calcule le centile d'une valeur dans un tableau, en alignement
 * avec la fonction quantile utilisee pour les courbes de centiles.
 * Trouve le centile c tel que quantile(arr, c/100) ~= value.
 */
function computePercentileRank(arr: number[], value: number): number {
  if (arr.length === 0) return 50;
  const sorted = [...arr].sort((a, b) => a - b);

  // Cas extremes
  if (value <= sorted[0]) return 1;
  if (value >= sorted[sorted.length - 1]) return 99;

  // Recherche binaire : trouver le centile c tel que quantile(c/100) <= value
  let lo = 1;
  let hi = 99;
  while (hi - lo > 1) {
    const mid = Math.floor((lo + hi) / 2);
    const q = quantile(sorted, mid / 100);
    if (q == null || value >= q) lo = mid;
    else hi = mid;
  }
  return lo;
}

interface ReferencePatient {
  age: number;
  neurocog_age_flu_weight: number;
  sex: number;
  dementia_dx_code: string;
}

export function CentileChart({ results }: CentileChartProps) {
  const currentAge = results.patient_age ?? results.nca_prediction?.age_chronologique ?? 65;
  const currentNCA = results.nca_prediction?.nca_predicted ?? currentAge;
  const patientSex = results.patient_sex ?? 1;

  const refCohort: ReferencePatient[] = (results as any).reference_cohort ?? [];

  // Filtrer la cohorte de reference par sexe uniquement (CON + SCD + MCI + AD)
  // pour couvrir tout le spectre du risque cognitif. OTHER_DEM est exclu (groupe heterogene).
  // La calibration des centiles doit refleter la population reelle, pas seulement les sains.
  const cohortFiltered = useMemo(
    () =>
      refCohort.filter(
        (p) =>
          p.sex === patientSex &&
          p.dementia_dx_code !== "OTHER_DEM" &&
          p.age != null &&
          p.neurocog_age_flu_weight != null
      ),
    [refCohort, patientSex]
  );

  // Calcul des centiles par tranche d'age avec fenetre ADAPTATIVE
  // (essaie +/- 3, puis +/- 5, puis +/- 8 ans si pas assez de patients)
  const centileData = useMemo(() => {
    const data: any[] = [];
    const ageMin = 50;
    const ageMax = 95;

    for (let age = ageMin; age <= ageMax; age++) {
      let ncaValues: number[] = [];
      for (const halfWidth of [3, 5, 8]) {
        const window = cohortFiltered.filter(
          (p) => p.age >= age - halfWidth && p.age <= age + halfWidth
        );
        if (window.length >= 5) {
          ncaValues = window.map((p) => p.neurocog_age_flu_weight);
          break;
        }
      }

      if (ncaValues.length < 5) {
        data.push({ age, p3: null, p10: null, p25: null, p50: null, p75: null, p90: null, p97: null });
        continue;
      }

      const sorted = [...ncaValues].sort((a, b) => a - b);
      // Etendre les zones extremes pour inclure les patients tres au-dessus/au-dessous de la cohorte
      const cohortMin = sorted[0];
      const cohortMax = sorted[sorted.length - 1];
      // Zone extreme s'etend jusqu'a 5 ans au-dela des extremes de la cohorte
      const p1 = cohortMin - 5;
      const p99 = cohortMax + 5;
      const p3 = quantile(ncaValues, 0.03);
      const p10 = quantile(ncaValues, 0.10);
      const p25 = quantile(ncaValues, 0.25);
      const p50 = quantile(ncaValues, 0.50);
      const p75 = quantile(ncaValues, 0.75);
      const p90 = quantile(ncaValues, 0.90);
      const p97 = quantile(ncaValues, 0.97);

      // Pour le stacked area : on calcule les ecarts entre centiles
      data.push({
        age,
        p1,
        p3,
        p10,
        p25,
        p50,
        p75,
        p90,
        p97,
        p99,
        // Zones empilees pour le rendu (avec zones extremes <3e et >97e)
        zone_below_p1: p1, // base invisible
        zone_p1_p3: p3 != null && p1 != null ? p3 - p1 : null, // zone < 3e (extreme bas)
        zone_3_10: p10 != null && p3 != null ? p10 - p3 : null,
        zone_10_25: p25 != null && p10 != null ? p25 - p10 : null,
        zone_25_75: p75 != null && p25 != null ? p75 - p25 : null,
        zone_75_90: p90 != null && p75 != null ? p90 - p75 : null,
        zone_90_97: p97 != null && p90 != null ? p97 - p90 : null,
        zone_p97_p99: p99 != null && p97 != null ? p99 - p97 : null, // zone > 97e (extreme haut)
      });
    }

    return data;
  }, [cohortFiltered]);

  // Calcul du centile du patient avec fenetre adaptative
  // (elargit jusqu'a +/- 8 ans si pas assez de patients dans le voisinage immediat)
  const patientCentile = useMemo(() => {
    for (const halfWidth of [3, 5, 8]) {
      const window = cohortFiltered.filter(
        (p) => p.age >= currentAge - halfWidth && p.age <= currentAge + halfWidth
      );
      if (window.length >= 5) {
        const ncaValues = window.map((p) => p.neurocog_age_flu_weight);
        return computePercentileRank(ncaValues, currentNCA);
      }
    }
    return null;
  }, [cohortFiltered, currentAge, currentNCA]);

  // Pour le NCA : NCA BAS pour son age = cerveau JEUNE = BON
  //               NCA HAUT pour son age = cerveau VIEUX = MAUVAIS
  // Donc l'interpretation est INVERSEE par rapport aux courbes IMC pediatriques
  const interpretation = useMemo(() => {
    if (patientCentile == null) return "Calcul non disponible (echantillon insuffisant)";
    if (patientCentile < 3) return "Cerveau exceptionnellement jeune (< 3e centile) - vieillissement remarquable";
    if (patientCentile < 10) return "Cerveau plus jeune que la moyenne (3-10e centile) - excellent vieillissement";
    if (patientCentile < 25) return "Vieillissement legerement ralenti (10-25e centile) - bon profil";
    if (patientCentile < 75) return "Vieillissement typique (25-75e centile) - dans la norme";
    if (patientCentile < 90) return "Vieillissement legerement accelere (75-90e centile) - a surveiller";
    if (patientCentile < 97) return "Vieillissement accelere (90-97e centile) - vigilance recommandee";
    return "Vieillissement tres accelere (> 97e centile) - evaluation clinique recommandee";
  }, [patientCentile]);

  // Couleurs pour le centile du PATIENT : inversees (centile bas = bon)
  const centileColor = useMemo(() => {
    if (patientCentile == null) return "#9ca3af";
    if (patientCentile < 10) return "#a855f7";   // violet (excellent - cerveau tres jeune)
    if (patientCentile < 25) return "#3b82f6";   // bleu (bon)
    if (patientCentile < 75) return "#22c55e";   // vert (normal)
    if (patientCentile < 90) return "#f59e0b";   // orange (a surveiller)
    return "#dc2626";                             // rouge (pathologique)
  }, [patientCentile]);

  // Filtrer les donnees pour ne garder que les ages avec des centiles valides
  // (les ages aux bords ont moins de 5 patients dans la fenetre)
  const validCentileData = useMemo(
    () => centileData.filter((d) => d.p50 != null),
    [centileData]
  );

  // Y axis : commence a 45 (fixe, plage clinique standardisee), max ajuste sur les donnees
  const yDomain = useMemo<[number, number]>(() => {
    const maxValues: number[] = [];
    validCentileData.forEach((d) => {
      if (d.p97 != null) maxValues.push(d.p97);
    });
    if (maxValues.length === 0) return [45, 95];
    const max = Math.max(...maxValues, currentNCA);
    return [45, Math.ceil(max + 2)];
  }, [validCentileData, currentNCA]);

  // Ticks Y : intervalle de 2 ans pour une lecture fine
  const yTicks = useMemo(() => {
    const start = Math.ceil(yDomain[0] / 2) * 2;
    const ticks: number[] = [];
    for (let v = start; v <= yDomain[1]; v += 2) ticks.push(v);
    return ticks;
  }, [yDomain]);

  // X axis : resserre sur les ages avec donnees, mais inclut TOUJOURS l'age du patient
  const xDomain = useMemo<[number, number]>(() => {
    if (validCentileData.length === 0) return [50, 90];
    const ages = validCentileData.map((d) => d.age);
    const minAge = Math.min(...ages, currentAge - 1);
    const maxAge = Math.max(...ages, currentAge + 1);
    return [minAge, maxAge];
  }, [validCentileData, currentAge]);

  const xTicks = useMemo(() => {
    const ticks: number[] = [];
    const start = Math.ceil(xDomain[0] / 5) * 5;
    for (let v = start; v <= xDomain[1]; v += 5) ticks.push(v);
    return ticks;
  }, [xDomain]);

  if (cohortFiltered.length < 50) {
    return (
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle>Courbes de centiles (NCA)</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-400">
            Cohorte de reference insuffisante pour calculer les centiles ({cohortFiltered.length} patients).
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gray-900 border-gray-800 w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <CardTitle className="text-xl">Courbes de centiles - Age neurocognitif</CardTitle>
            <p className="text-sm text-gray-400 mt-1">
              Position du patient par rapport a la population de reference ({cohortFiltered.length} sujets - CON/SCD/MCI/AD, sexe {patientSex === 1 ? "masculin" : "feminin"})
            </p>
          </div>
          {patientCentile != null && (
            <div className="text-right">
              <div className="text-xs text-gray-400 uppercase tracking-wide">Centile patient</div>
              <div className="text-3xl font-bold" style={{ color: centileColor }}>
                {patientCentile}<span className="text-lg">e</span>
              </div>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="px-2 pb-4">
        <div className="mb-4 p-3 rounded-lg" style={{ backgroundColor: `${centileColor}15`, border: `1px solid ${centileColor}40` }}>
          <p className="text-sm" style={{ color: centileColor }}>
            <strong>Interpretation :</strong> {interpretation}
          </p>
        </div>

        <ResponsiveContainer width="100%" height={500}>
          <ComposedChart data={validCentileData} margin={{ top: 20, right: 20, left: 10, bottom: 40 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey="age"
              type="number"
              domain={xDomain}
              ticks={xTicks}
              stroke="#9ca3af"
              label={{ value: "Age chronologique (annees)", position: "insideBottom", offset: -10, fill: "#9ca3af" }}
            />
            <YAxis
              domain={yDomain}
              ticks={yTicks}
              allowDataOverflow={true}
              stroke="#9ca3af"
              label={{ value: "Age neurocognitif (annees)", angle: -90, position: "insideLeft", fill: "#9ca3af" }}
            />
            <Tooltip
              contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: "8px" }}
              labelStyle={{ color: "#f3f4f6" }}
              formatter={(value: any, name: string) => {
                if (value == null) return ["-", name];
                if (name.startsWith("zone_")) return null;
                return [`${value.toFixed(1)} ans`, name.toUpperCase()];
              }}
              labelFormatter={(age: number) => `Age : ${age} ans`}
            />

            {/* Zones empilees - couleurs INVERSEES car NCA bas = bon, NCA haut = mauvais */}
            <Area type="monotone" dataKey="zone_below_p1" stackId="1" stroke="none" fill="transparent" legendType="none" />
            <Area type="monotone" dataKey="zone_p1_p3" stackId="1" stroke="none" fill="#7c3aed" fillOpacity={0.6} name="<3e (exceptionnel)" />
            <Area type="monotone" dataKey="zone_3_10" stackId="1" stroke="none" fill="#a855f7" fillOpacity={0.5} name="3-10e (excellent)" />
            <Area type="monotone" dataKey="zone_10_25" stackId="1" stroke="none" fill="#3b82f6" fillOpacity={0.5} name="10-25e (bon)" />
            <Area type="monotone" dataKey="zone_25_75" stackId="1" stroke="none" fill="#22c55e" fillOpacity={0.5} name="25-75e (normal)" />
            <Area type="monotone" dataKey="zone_75_90" stackId="1" stroke="none" fill="#f59e0b" fillOpacity={0.5} name="75-90e (a surveiller)" />
            <Area type="monotone" dataKey="zone_90_97" stackId="1" stroke="none" fill="#dc2626" fillOpacity={0.5} name="90-97e (vigilance)" />
            <Area type="monotone" dataKey="zone_p97_p99" stackId="1" stroke="none" fill="#7f1d1d" fillOpacity={0.7} name=">97e (extreme)" />

            {/* Lignes des centiles - cachees de la legende (deja representees par les zones colorees) */}
            <Line type="monotone" dataKey="p3" stroke="#a855f7" strokeWidth={1.5} strokeDasharray="3 3" dot={false} name="3e" legendType="none" />
            <Line type="monotone" dataKey="p10" stroke="#3b82f6" strokeWidth={1.5} dot={false} name="10e" legendType="none" />
            <Line type="monotone" dataKey="p25" stroke="#22c55e" strokeWidth={1.5} dot={false} name="25e" legendType="none" />
            <Line type="monotone" dataKey="p50" stroke="#16a34a" strokeWidth={2.5} dot={false} name="50e (mediane)" />
            <Line type="monotone" dataKey="p75" stroke="#22c55e" strokeWidth={1.5} dot={false} name="75e" legendType="none" />
            <Line type="monotone" dataKey="p90" stroke="#f59e0b" strokeWidth={1.5} dot={false} name="90e" legendType="none" />
            <Line type="monotone" dataKey="p97" stroke="#dc2626" strokeWidth={1.5} strokeDasharray="3 3" dot={false} name="97e" legendType="none" />

            {/* Point patient */}
            <ReferenceDot
              x={currentAge}
              y={currentNCA}
              r={8}
              fill={centileColor}
              stroke="#ffffff"
              strokeWidth={2}
              label={{
                value: `${patientCentile != null ? patientCentile + "e centile" : "Patient"}`,
                position: "top",
                fill: centileColor,
                fontSize: 12,
                fontWeight: "bold",
              }}
            />

            <Legend
              wrapperStyle={{ paddingTop: "10px" }}
              iconType="line"
              payload={[
                { value: "<3e (exceptionnel)", type: "line", color: "#7c3aed" },
                { value: "3-10e (excellent)", type: "line", color: "#a855f7" },
                { value: "10-25e (bon)", type: "line", color: "#3b82f6" },
                { value: "25-75e (normal)", type: "line", color: "#22c55e" },
                { value: "50e (mediane)", type: "line", color: "#16a34a" },
                { value: "75-90e (a surveiller)", type: "line", color: "#f59e0b" },
                { value: "90-97e (vigilance)", type: "line", color: "#dc2626" },
                { value: ">97e (extreme)", type: "line", color: "#7f1d1d" },
              ]}
            />
          </ComposedChart>
        </ResponsiveContainer>

        {/* Legende des zones - logique inversee pour le NCA */}
        <div className="mt-4 p-3 bg-gray-800/50 rounded-lg">
          <p className="text-xs text-gray-400 mb-2 italic">
            Pour le NCA : un cerveau jeune pour son age (NCA bas) est BON, un cerveau vieux (NCA haut) est MAUVAIS
          </p>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: "#a855f7", opacity: 0.5 }}></div>
              <span className="text-gray-300"><b>3-10e</b> : excellent</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: "#3b82f6", opacity: 0.5 }}></div>
              <span className="text-gray-300"><b>10-25e</b> : bon</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: "#22c55e", opacity: 0.5 }}></div>
              <span className="text-gray-300"><b>25-75e</b> : normal</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: "#f59e0b", opacity: 0.5 }}></div>
              <span className="text-gray-300"><b>75-90e</b> : a surveiller</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: "#dc2626", opacity: 0.5 }}></div>
              <span className="text-gray-300"><b>90-97e</b> : vigilance</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
