import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import { ExtendedPredictionOutput } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { formatNumber, formatNumberWithSign } from '../utils/numberFormat';

interface ExplainableAIProps {
  results: ExtendedPredictionOutput;
}

// ── Poids d'impact clinique par facteur (en années de NCA) ────────────────────
// Source : méta-analyses sur les facteurs de risque de démence + importance
// LightGBM relative (Livingston et al. 2020, Norton et al. 2014).
// Signe négatif = facteur aggravant l'âge neurocognitif.
// Signe positif = facteur protecteur.

const FACTOR_WEIGHTS: {
  key: string;
  label: string;
  impact: number;           // en années
  inverted: boolean;        // true si 0 = mauvais (ex. physical_activity=0 = sédentaire)
  modifiable: boolean;
  recommendation?: string;
}[] = [
  // ── Facteurs de risque ──────────────────────────────────────────────────
  { key: 'sleep_deprivation',    label: 'Privation de sommeil',     impact: -2.1, inverted: false, modifiable: true,  recommendation: 'Améliorer la qualité et la durée du sommeil (7-9h/nuit)' },
  { key: 'social_life',          label: 'Isolement social',         impact: -1.8, inverted: true,  modifiable: true,  recommendation: 'Augmenter les interactions sociales régulières' },
  { key: 'income',               label: 'Difficultés financières',  impact: -1.5, inverted: true,  modifiable: true,  recommendation: 'Orienter vers les services sociaux disponibles' },
  { key: 'depression',           label: 'Dépression',               impact: -1.4, inverted: false, modifiable: true,  recommendation: 'Traitement de la dépression (psychothérapie / médication)' },
  { key: 'physical_activity',    label: 'Sédentarité',              impact: -1.2, inverted: true,  modifiable: true,  recommendation: 'Au moins 150 min/semaine d\'activité modérée' },
  { key: 'cognitive_activities', label: 'Inactivité cognitive',     impact: -1.1, inverted: true,  modifiable: true,  recommendation: 'Stimulation cognitive : lecture, jeux, apprentissage' },
  { key: 'hta',                  label: 'Hypertension',             impact: -1.0, inverted: false, modifiable: true,  recommendation: 'Contrôle tensionnel < 130/80 mmHg' },
  { key: 'diab_type2',           label: 'Diabète type 2',           impact: -0.8, inverted: false, modifiable: true,  recommendation: 'Contrôle glycémique strict (HbA1c < 7%)' },
  { key: 'smoking',              label: 'Tabagisme',                impact: -0.7, inverted: false, modifiable: true,  recommendation: 'Arrêt du tabac — bénéfice cérébral dès 5 ans' },
  { key: 'nutrition_score',      label: 'Mauvaise nutrition',       impact: -0.6, inverted: true,  modifiable: true,  recommendation: 'Régime méditerranéen ou MIND' },
  { key: 'obesity',              label: 'Obésité',                  impact: -0.6, inverted: false, modifiable: true,  recommendation: 'Réduction du poids corporel (IMC < 30)' },
  { key: 'alcohol',              label: 'Alcool',                   impact: -0.5, inverted: false, modifiable: true,  recommendation: 'Réduction ou arrêt de la consommation d\'alcool' },
  { key: 'anxiety',              label: 'Anxiété',                  impact: -0.5, inverted: false, modifiable: true,  recommendation: 'Prise en charge de l\'anxiété chronique' },
  { key: 'poly_pharm5',          label: 'Polypharmacie',            impact: -0.4, inverted: false, modifiable: true,  recommendation: 'Révision médicamenteuse — réduire si possible' },
  { key: 'living_alone',         label: 'Vit seul(e)',              impact: -0.4, inverted: false, modifiable: false, recommendation: '' },
  { key: 'chol_total',           label: 'Cholestérol élevé',        impact: -0.3, inverted: false, modifiable: true,  recommendation: 'Contrôle du cholestérol LDL' },
  { key: 'stroke',               label: 'AVC antérieur',            impact: -0.3, inverted: false, modifiable: false, recommendation: '' },
  { key: 'tbi',                  label: 'Traumatisme crânien',      impact: -0.3, inverted: false, modifiable: false, recommendation: '' },
  { key: 'hist_demence_fam',     label: 'Hist. familiale démence',  impact: -0.3, inverted: false, modifiable: false, recommendation: '' },
  { key: 'hist_demence_parent',  label: 'Hist. parentale démence',  impact: -0.2, inverted: false, modifiable: false, recommendation: '' },
];

export function ExplainableAI({ results }: ExplainableAIProps) {
  const r = results as any;
  const delta = results.nca_prediction?.delta_nca ?? (r.delta_neurocogage_flu_weight ?? 0);

  // ── Facteurs actifs (présents chez ce patient) ─────────────────────────────
  const activeRiskFactors = FACTOR_WEIGHTS.filter(({ key, inverted }) => {
    const val = r[key];
    if (val === undefined || val === null) return false;
    return inverted ? val === 0 : val === 1 || Number(val) > 0;
  }).map(({ key, label, impact, modifiable, recommendation }) => ({
    key, label, impact, type: 'risk' as const, modifiable, recommendation,
  }));

  // ── Facteurs protecteurs basés sur les vraies valeurs ─────────────────────
  const protectiveFactors: { key: string; label: string; impact: number; type: 'protective'; modifiable: boolean; recommendation: string }[] = [];

  // Éducation
  const edu = Number(r.education ?? 0);
  if (edu >= 16) protectiveFactors.push({ key: 'education', label: 'Formation supérieure', impact: 1.2, type: 'protective', modifiable: false, recommendation: '' });
  else if (edu >= 14) protectiveFactors.push({ key: 'education', label: 'Éducation avancée', impact: 0.8, type: 'protective', modifiable: false, recommendation: '' });
  else if (edu >= 12) protectiveFactors.push({ key: 'education', label: 'Éducation collégiale', impact: 0.4, type: 'protective', modifiable: false, recommendation: '' });

  // Plurilinguisme
  const nbLang = Number(r.nb_language ?? 1);
  if (nbLang >= 3) protectiveFactors.push({ key: 'nb_language', label: 'Trilinguisme+', impact: 0.7, type: 'protective', modifiable: false, recommendation: '' });
  else if (nbLang === 2) protectiveFactors.push({ key: 'nb_language', label: 'Bilinguisme', impact: 0.5, type: 'protective', modifiable: false, recommendation: '' });

  // Fluence verbale élevée
  const fluency = Number(r.fluency_score ?? 0);
  if (fluency >= 20) protectiveFactors.push({ key: 'fluency_score', label: 'Fluence verbale élevée', impact: 0.4, type: 'protective', modifiable: false, recommendation: '' });

  // ── Données pour le graphique (top 8 par impact absolu) ───────────────────
  const allFactors = [...activeRiskFactors, ...protectiveFactors]
    .sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact))
    .slice(0, 8);

  // ── Totaux ─────────────────────────────────────────────────────────────────
  const totalRisk = activeRiskFactors.reduce((s, f) => s + Math.abs(f.impact), 0);
  const totalProtective = protectiveFactors.reduce((s, f) => s + f.impact, 0);

  // ── Top 3 recommandations (facteurs modifiables actifs, par impact) ────────
  const topRecommendations = activeRiskFactors
    .filter(f => f.modifiable && f.recommendation)
    .slice(0, 3);

  // ── Domaine XAxis dynamique ───────────────────────────────────────────────
  const minImpact = Math.min(...allFactors.map(f => f.impact), -0.5);
  const maxImpact = Math.max(...allFactors.map(f => f.impact), 0.5);
  const xMin = Math.floor(minImpact) - 0.5;
  const xMax = Math.ceil(maxImpact) + 0.5;

  const chartHeight = Math.max(250, allFactors.length * 36 + 40);

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader>
        <CardTitle className="text-xl">Pourquoi ce Résultat ?</CardTitle>
        <p className="text-sm text-gray-400 mt-2 leading-relaxed">
          Le NCA est décalé de{' '}
          <span className={`font-semibold ${delta > 0 ? 'text-red-400' : 'text-green-400'}`}>
            {formatNumberWithSign(delta, 1)} ans
          </span>{' '}
          par rapport à l'âge chronologique.
          {activeRiskFactors.length > 0 && (
            <>
              {' '}Les principaux facteurs aggravants sont{' '}
              <span className="text-red-400 font-medium">
                {activeRiskFactors.slice(0, 3).map(f => f.label).join(', ')}
              </span>.
            </>
          )}
          {protectiveFactors.length > 0 && (
            <>
              {' '}La réserve cognitive (
              <span className="text-green-400 font-medium">
                {protectiveFactors.map(f => f.label).join(', ')}
              </span>
              ) compense de{' '}
              <span className="text-green-400 font-medium">+{formatNumber(totalProtective, 1)} ans</span>.
            </>
          )}
        </p>
      </CardHeader>

      <CardContent>
        {allFactors.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm">
            Aucun facteur de risque identifié pour ce patient.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={chartHeight}>
            <BarChart
              data={allFactors}
              layout="vertical"
              margin={{ top: 5, right: 40, left: 140, bottom: 30 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal={false} />
              <XAxis
                type="number"
                stroke="#9ca3af"
                tick={{ fill: '#6b7280', fontSize: 11 }}
                domain={[xMin, xMax]}
                label={{
                  value: "Impact estimé sur l'âge neurocognitif (années)",
                  position: 'insideBottom',
                  offset: -18,
                  fill: '#9ca3af',
                  fontSize: 11,
                }}
              />
              <YAxis
                type="category"
                dataKey="label"
                stroke="#9ca3af"
                tick={{ fill: '#d1d5db', fontSize: 11 }}
                width={135}
              />
              <ReferenceLine x={0} stroke="#4b5563" strokeWidth={1.5} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px', color: '#fff' }}
                formatter={(value: any) => [`${formatNumberWithSign(Number(value), 1)} ans`, 'Impact estimé']}
                labelStyle={{ color: '#f3f4f6', fontWeight: 600 }}
              />
              <Bar dataKey="impact" radius={[0, 4, 4, 0]}>
                {allFactors.map((entry, i) => (
                  <Cell key={i} fill={entry.type === 'risk' ? '#ef4444' : '#22c55e'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}

        {/* Légende */}
        <div className="mt-3 flex items-center justify-center gap-6 text-xs text-gray-400">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-red-500" />
            Facteur aggravant
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-green-500" />
            Facteur protecteur
          </div>
          <span className="text-gray-600">— poids cliniques estimés</span>
        </div>

        {/* Totaux */}
        <div className="grid grid-cols-2 gap-4 mt-5">
          <div className="p-4 bg-red-900/20 border border-red-900/50 rounded-lg">
            <p className="text-xs text-red-400 mb-1">Impact négatif cumulé</p>
            <p className="text-2xl font-bold text-red-400">
              -{formatNumber(totalRisk, 1)} ans
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {activeRiskFactors.length} facteur{activeRiskFactors.length > 1 ? 's' : ''} actif{activeRiskFactors.length > 1 ? 's' : ''}
            </p>
          </div>
          <div className="p-4 bg-green-900/20 border border-green-900/50 rounded-lg">
            <p className="text-xs text-green-400 mb-1">Protection estimée</p>
            <p className="text-2xl font-bold text-green-400">
              +{formatNumber(totalProtective, 1)} ans
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {protectiveFactors.length} facteur{protectiveFactors.length > 1 ? 's' : ''} protecteur{protectiveFactors.length > 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Recommandations dynamiques */}
        {topRecommendations.length > 0 && (
          <div className="mt-5 p-4 bg-blue-900/20 border border-blue-800/40 rounded-lg">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-sm font-semibold text-blue-400 mb-2">
                  Recommandations prioritaires
                </p>
                <ul className="space-y-1.5">
                  {topRecommendations.map((f, i) => (
                    <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                      <span className="text-red-400 font-bold mt-0.5">•</span>
                      <span>
                        {f.recommendation}
                        <span className="text-red-400/70 text-xs ml-1">
                          (impact estimé : {formatNumberWithSign(Math.abs(f.impact), 1)} ans)
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}