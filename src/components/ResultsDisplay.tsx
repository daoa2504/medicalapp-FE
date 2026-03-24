// ResultsDisplay.tsx - VERSION AVEC NCA INTÉGRÉ
import { useMemo, useState } from "react";
import { ExtendedPredictionOutput } from "../types";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

import { ScatterPlotChart } from "./ScatterPlotChart";
import { TrajectoryChart } from "./TrajectoryChart";
import { ExplainableAI } from "./ExplainableAI";
import { RiskFactorsPanel } from "./RiskFactorsPanel";
import { DiagnosticZonesChart } from "./DiagnosticZonesChart";
import { GrowthCurveChart } from "./GrowthCurveChart";
import { formatNumber, formatNumberWithSign } from "../utils/numberFormat";
import { RiskGauges } from '@/components/RiskGauges';
interface ResultsDisplayProps {
  results: ExtendedPredictionOutput;
  onBack: () => void;
}

type TabKey = "position" | "trajectory" | "percentiles" | "centiles";

export function ResultsDisplay({ results, onBack }: ResultsDisplayProps) {
  console.log("RESULTS 👉", results);
  const [activeTab, setActiveTab] = useState<TabKey>("position");
  
   
  // Example calculation
  const healthEquityScore = 68;

  // ✅ Remount key: force le montage du chart quand on change d'onglet
  const chartKey = useMemo(() => `chart-${activeTab}-${results?.identifier ?? "x"}`, [activeTab, results?.identifier]);
  
  return (
    <div className="space-y-6">
      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button onClick={onBack} variant="outline" className="border-gray-700">
          ← Retour au formulaire
        </Button>

        <div className="text-sm text-gray-400">
          Patient : <span className="text-white font-semibold">{results.identifier}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6 min-w-0">
          <Card className="bg-gray-900 border-gray-800 min-w-0">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">Évaluation Neurocognitive</CardTitle>
                  <p className="text-sm text-gray-400 mt-1">
                    {activeTab === "position"
                      ? "Positionnement dans la cohorte de référence"
                      : activeTab === "trajectory"
                        ? "Trajectoire temporelle du vieillissement neurocognitif"
                        : activeTab === "percentiles"
                          ? "Zones diagnostiques (Normale / MCI / Pathologique)"
                          : "Courbes de centiles normatives (CentileBrain)"}
                  </p>
                </div>
              </div>
            </CardHeader>

            {/* ✅ Important: min-w-0 sur CardContent aussi */}
            <CardContent className="min-w-0">
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabKey)}>
                <TabsList className="grid w-full grid-cols-4 bg-gray-800 mb-6">
                  <TabsTrigger value="position">📊 Module 1</TabsTrigger>
                  <TabsTrigger value="trajectory">📈 Module 2</TabsTrigger>
                  <TabsTrigger value="percentiles">🧭 Zones</TabsTrigger>
                  <TabsTrigger value="centiles">📉 Centiles</TabsTrigger>
                </TabsList>

                {/* Module 1 */}
                <TabsContent
                  value="position"
                  className="min-w-0 min-h-[560px]"
                >
                  <div className="space-y-4 min-w-0">
                    <div className="p-4 bg-blue-900/20 border border-blue-900 rounded-lg">
                      <p className="text-sm text-blue-400">
                        <strong>Objectif :</strong> Situer le patient par rapport à la cohorte de référence
                        et identifier immédiatement les écarts par rapport aux normes.
                      </p>
                    </div>

                    <div className="min-w-0">
                      <ScatterPlotChart key={chartKey} results={results} />
                    </div>
                  </div>
                </TabsContent>

                {/* Module 2 */}
                <TabsContent
                  value="trajectory"
                  className="min-w-0 min-h-[560px]"
                >
                  <div className="space-y-4 min-w-0">
                    <div className="p-4 bg-purple-900/20 border border-purple-900 rounded-lg">
                      <p className="text-sm text-purple-400">
                        <strong>Objectif :</strong> Anticiper l'évolution future du vieillissement
                        neurocognitif et identifier les opportunités d'intervention.
                      </p>
                    </div>

                    <div className="min-w-0">
                      <TrajectoryChart key={chartKey} results={results} />
                    </div>
                  </div>
                </TabsContent>

                {/* Zones diagnostiques */}
                <TabsContent
                  value="percentiles"
                  className="min-w-0 min-h-[620px]"
                >
                  <div className="space-y-4 min-w-0">
                    <div className="p-4 bg-green-900/20 border border-green-900 rounded-lg">
                      <p className="text-sm text-green-400">
                        <strong>Objectif :</strong> Situer le patient dans les zones diagnostiques
                        (Normale/MCI/Pathologique) selon son sexe, avec projection future.
                      </p>
                    </div>

                    <div className="min-w-0">
                      <DiagnosticZonesChart key={chartKey} results={results} height={520} />
                    </div>
                  </div>
                </TabsContent>

                {/* ========== Courbes de Centiles ========== */}
                <TabsContent
                  value="centiles"
                  className="min-w-0 min-h-[620px]"
                >
                  <div className="space-y-4 min-w-0">
                    <div className="p-4 bg-yellow-900/20 border border-yellow-900 rounded-lg">
                      <p className="text-sm text-yellow-400">
                        <strong>Objectif :</strong> Situer le patient sur les courbes de croissance cognitive
                        (style IMC) avec zones diagnostiques pleines (CON/MCI/AD) + courbes de centiles (3e-97e).
                      </p>
                    </div>

                    <div className="min-w-0">
                      {results.centile_curves ? (
                        <GrowthCurveChart key={chartKey} results={results} height={600} />
                      ) : (
                        <div className="text-center p-12 bg-gray-800/50 rounded-lg">
                          <div className="text-gray-400 mb-2">
                            <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                          </div>
                          <p className="text-lg font-semibold text-gray-300 mb-2">
                            Données de centiles non disponibles
                          </p>
                          <p className="text-sm text-gray-400 max-w-md mx-auto">
                            Le backend n'a pas retourné les courbes de centiles. Vérifiez que l'API utilise
                            <code className="px-2 py-1 bg-gray-900 rounded mx-1">api_views_WITH_CENTILES.py</code>
                            et que le fichier <code className="px-2 py-1 bg-gray-900 rounded mx-1">Data_NCA_exposome.xlsx</code> est présent.
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Info explicative */}
                    {results.centile_curves && (
                      <div className="p-4 bg-blue-900/10 border border-blue-500/20 rounded-lg">
                        <div className="flex items-start gap-3">
                          <svg className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <div className="text-sm text-gray-300 space-y-1">
                            <p className="font-semibold text-blue-300">À propos des courbes de croissance cognitive</p>
                            <p>
                              Graphique de style <strong>courbes IMC pédiatriques</strong> permettant de situer le patient
                              par rapport à une population de référence de <strong>1118 patients</strong> (âges 50-91 ans).
                            </p>
                            <p className="text-xs text-gray-400 mt-2">
                              • <strong>Zones pleines</strong> : Normale (verte), MCI (bleue), Pathologique (rouge)<br />
                              • <strong>Courbes noires/bleues</strong> : centiles de référence (3e, 10e, 25e, 50e, 75e, 90e, 97e)<br />
                              • <strong>Point orange</strong> : position du patient avec centile et zone diagnostique
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Gauges */}
          {/* ========== NOUVELLE SECTION : GAUGES DE RISQUE ========== */}
      
             {results.risk_scores && (
                <RiskGauges
                  riskDementia={results.risk_scores.risk_dementia * 100}
                  riskHandicap={results.risk_scores.risk_handicap * 100}
                />
)}
 
         {/*  <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-xl">Évaluation des Risques</CardTitle>
              <p className="text-sm text-gray-400">
                Probabilité de troubles neurodégénératifs et de handicap cognitif
              </p>
            </CardHeader>
            <CardContent className="min-w-0">
              <div className="grid grid-cols-2 gap-6 min-w-0">
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold mb-4 text-center">Risque de Démence (5 ans)</h3>
                  <GaugeChart value={results.risk_dementia * 100} title="Risque de Démence" />
                </div>

                <div className="min-w-0">
                  <h3 className="text-sm font-semibold mb-4 text-center">Risque de Handicap Cognitif</h3>
                  <GaugeChart value={results.risk_handicap * 100} title="Risque de Handicap" />
                </div>
              </div>
            </CardContent>
          </Card> */}

          {/* ========== NOUVEAU : RÉSULTATS NCA ========== */}
          {results.nca_prediction && (
            <Card className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 border-blue-900/50">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <CardTitle className="text-xl">Âge Neurocognitif (NCA)</CardTitle>
                    <p className="text-sm text-gray-400">Prédiction par modèle LightGBM avec gestion des données partielles</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Métriques principales */}
                <div className="grid grid-cols-3 gap-4">
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
                  </div>
                  
                  <div className="text-center p-4 bg-gray-800/50 rounded-lg">
                    <p className="text-xs text-gray-400 mb-2">Delta NCA</p>
                    <p className={`text-3xl font-bold ${
                      results.nca_prediction.delta_nca > 0 ? 'text-orange-500' : 
                      results.nca_prediction.delta_nca < 0 ? 'text-green-500' : 'text-gray-400'
                    }`}>
                      {formatNumberWithSign(results.nca_prediction.delta_nca, 1)} ans
                    </p>
                  </div>
                </div>

                {/* Interprétation */}
                <div className="flex items-center gap-3 p-4 bg-blue-900/20 rounded-lg border border-blue-500/30">
                  {results.nca_prediction.delta_nca > 0 ? (
                    <svg className="w-6 h-6 text-orange-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  ) : (
                    <svg className="w-6 h-6 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                    </svg>
                  )}
                  <div className="flex-1">
                    <p className="font-semibold text-white">{results.nca_prediction.interpretation}</p>
                    <p className="text-sm text-gray-400 mt-1">
                      {results.nca_prediction.delta_nca > 0 
                        ? `Le cerveau vieillit ${Math.abs(results.nca_prediction.delta_nca).toFixed(1)} ans plus vite que le corps`
                        : results.nca_prediction.delta_nca < 0
                          ? `Le cerveau vieillit ${Math.abs(results.nca_prediction.delta_nca).toFixed(1)} ans moins vite que le corps`
                          : `Le cerveau vieillit au même rythme que le corps`
                      }
                    </p>
                  </div>
                </div>

                {/* Fiabilité */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-300">Fiabilité de la prédiction</p>
                      <p className="text-xs text-gray-500">
                        Basée sur {results.nca_prediction.features_used}/{results.nca_prediction.features_total} champs remplis
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-blue-400">{results.nca_prediction.reliability}</p>
                      <p className="text-sm">{results.nca_prediction.reliability_stars}</p>
                    </div>
                  </div>

                  {/* Barre de progression */}
                  <div className="relative">
                    <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all ${
                          results.nca_prediction.completeness >= 90 ? 'bg-green-500' :
                          results.nca_prediction.completeness >= 70 ? 'bg-blue-500' :
                          results.nca_prediction.completeness >= 50 ? 'bg-yellow-500' : 'bg-orange-500'
                        }`}
                        style={{ width: `${results.nca_prediction.completeness}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-1 text-center">
                      {formatNumber(results.nca_prediction.completeness, 0)}% de complétude
                    </p>
                  </div>

                  {/* Détail features */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center p-3 bg-green-900/20 rounded-lg border border-green-500/30">
                      <p className="text-xs text-gray-400 mb-1">Obligatoires</p>
                      <p className="text-lg font-bold text-green-400">
                        {results.nca_prediction.features_detail.obligatoires ? '✓' : '✗'}
                      </p>
                    </div>
                    
                    <div className="text-center p-3 bg-blue-900/20 rounded-lg border border-blue-500/30">
                      <p className="text-xs text-gray-400 mb-1">Cognitifs</p>
                      <p className="text-lg font-bold text-blue-400">
                        {results.nca_prediction.features_detail.cognitifs}/6
                      </p>
                    </div>
                    
                    <div className="text-center p-3 bg-purple-900/20 rounded-lg border border-purple-500/30">
                      <p className="text-xs text-gray-400 mb-1">Risques</p>
                      <p className="text-lg font-bold text-purple-400">
                        {results.nca_prediction.features_detail.risques}/21
                      </p>
                    </div>
                  </div>
                </div>

                {/* Recommandations si complétude <90% */}
                {results.nca_prediction.completeness < 90 && (
                  <div className="p-4 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
                    <div className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <p className="font-semibold text-yellow-300 mb-2">💡 Pour améliorer la précision</p>
                        <ul className="text-sm text-gray-300 space-y-1">
                          {results.nca_prediction.features_detail.cognitifs < 6 && (
                            <li>• Compléter les tests cognitifs optionnels (gain potentiel : ±0.6 ans)</li>
                          )}
                          {results.nca_prediction.features_detail.risques < 18 && (
                            <li>• Renseigner les facteurs de risque manquants (gain potentiel : ±0.2-0.8 ans)</li>
                          )}
                          {!results.nca_prediction.features_detail.obligatoires && (
                            <li>• Compléter tous les champs obligatoires pour une prédiction fiable</li>
                          )}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {/* Info sur le modèle */}
                <div className="p-3 bg-gray-800/50 rounded-lg border border-gray-700">
                  <p className="text-xs text-gray-400">
                    <strong className="text-gray-300">Modèle :</strong> LightGBM avec gestion native des valeurs manquantes (NaN) • 
                    <strong className="text-gray-300 ml-2">MAE :</strong> ~5.1 ans • 
                    <strong className="text-gray-300 ml-2">R² :</strong> 0.71-0.73
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Health Equity Alert */}
          {healthEquityScore > 60 && (
            <Card className="bg-red-900/20 border-red-900">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-red-900/40 flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <h3 className="font-semibold text-red-400">Alerte Équité en Santé</h3>
                    </div>
                    <p className="text-sm text-red-300 mb-3">
                      Score d'Équité en Santé Élevé : <span className="font-bold">{healthEquityScore}%</span>
                    </p>
                    <p className="text-sm text-gray-300 mb-2">
                      Envisager une orientation sociale en plus de la prise en charge neuropsychologique.
                    </p>
                    <p className="text-xs text-gray-400 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                        />
                      </svg>
                      Considérer l'intersectionnalité des facteurs socio-économiques
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <ExplainableAI results={results} />

          {/* Improvement Potential */}
          <Card className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 border-purple-900/50">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <CardTitle>Potentiel d'Amélioration</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-400 mb-2">Risque Actuel</p>
                  <p className="text-4xl font-bold text-orange-500">{Math.round(results.risk_dementia * 100)}%</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400 mb-2">Risque Atteignable</p>
                  <p className="text-4xl font-bold text-green-500">{Math.round(results.risk_dementia * 100 * 0.72)}%</p>
                </div>
              </div>

              <div className="mt-6 p-4 bg-gray-900/50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                  <p className="text-sm font-semibold text-green-400">
                    Votre risque actuel de {Math.round(results.risk_dementia * 100)}%
                  </p>
                </div>
                <p className="text-sm text-gray-300">
                  pourrait être ramené à {Math.round(results.risk_dementia * 100 * 0.72)}% si les facteurs modifiables sont traités.
                </p>
              </div>

              <div className="mt-4 p-4 bg-gray-900/50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm font-semibold text-purple-400">
                    Gain estimé : {formatNumber(results.delta_neurocogage_flu_weight * 0.18, 1)} ans sur l'ANC
                  </p>
                </div>
                <div className="mt-2 bg-gray-800 rounded-full h-2 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-purple-500 to-green-500" style={{ width: "28%" }} />
                </div>
                <p className="text-xs text-gray-400 mt-2">28% amélioration potentielle</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Panel */}
        <div className="lg:col-span-1 min-w-0">
          <RiskFactorsPanel />
        </div>
      </div>

      {/* Clinical Summary */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-lg">Synthèse Clinique</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4 text-center">
            <div className="p-3 bg-gray-800 rounded-lg">
              <p className="text-xs text-gray-400 mb-1">Âge</p>
              <p className="text-xl font-bold text-white">{results.age} ans</p>
            </div>
            <div className="p-3 bg-gray-800 rounded-lg">
              <p className="text-xs text-gray-400 mb-1">ANC</p>
              <p className="text-xl font-bold text-orange-500">{formatNumber(results.neurocog_age_flu_weight, 1)} ans</p>
            </div>
            <div className="p-3 bg-gray-800 rounded-lg">
              <p className="text-xs text-gray-400 mb-1">Delta</p>
              <p className="text-xl font-bold text-orange-500">
                 {formatNumberWithSign(results.delta_neurocogage_flu_weight, 1)} ans
              </p>
            </div>
            <div className="p-3 bg-gray-800 rounded-lg">
              <p className="text-xs text-gray-400 mb-1">Modèle</p>
              <p className="text-xl font-bold text-blue-500">
                {results.model_type === "model_1" ? "Basique" : results.model_type === "model_2" ? "Complet" : "Avancé"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
