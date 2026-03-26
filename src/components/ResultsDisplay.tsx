// ResultsDisplay.tsx - VERSION AVEC NCA INTÉGRÉ
import { useMemo, useState } from "react";
import { ExtendedPredictionOutput } from "../types";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

import { ScatterPlotChart } from "./ScatterPlotChart";
import { TrajectoryChart } from "./TrajectoryChart";

import { RiskFactorsPanel } from "./RiskFactorsPanel";
import { DiagnosticZonesChart } from "./DiagnosticZonesChart";
import { GrowthCurveChart } from "./GrowthCurveChart";
import { formatNumber, formatNumberWithSign } from "../utils/numberFormat";

interface ResultsDisplayProps {
  results: ExtendedPredictionOutput;
  onBack: () => void;
}

type TabKey = "position" | "trajectory" | "percentiles" | "centiles";

export function ResultsDisplay({ results, onBack }: ResultsDisplayProps) {
  console.log("RESULTS 👉", results);
  const [activeTab, setActiveTab] = useState<TabKey>("position");
  
   
  // Example calculation


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
                <TabsList className="grid w-full grid-cols-2 bg-gray-800 mb-6">
                  <TabsTrigger value="position">📊 Estimations et détection </TabsTrigger>
                  <TabsTrigger value="trajectory">📈 Estimations et détection </TabsTrigger>
                {/*   <TabsTrigger value="percentiles">🧭 Zones</TabsTrigger>
                  <TabsTrigger value="centiles">📉 Centiles</TabsTrigger> */}
                </TabsList>
{/* ========== NOUVEAU : RÉSULTATS NCA ========== */}
         
                {/* Module 1 */}
<TabsContent
  value="position"
  className="min-w-0 min-h-[560px]"
>
  <div className="space-y-4 min-w-0">
    <div className="p-4 bg-blue-900/20 border border-blue-900 rounded-lg">
      <p className="text-sm text-blue-400">
        <strong>Objectif :</strong> Situer le patient par rapport à la cohorte de référence
        et identifier immédiatement les écarts entre l’âge chronologique et l’âge neurocognitif.
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
  <div className="space-y-6">
    <div className="p-4 bg-purple-900/20 border border-purple-900 rounded-lg">
      <p className="text-sm text-purple-400">
        <strong>Objectif :</strong> Estimer l’évolution future du vieillissement
        neurocognitif et visualiser le bénéfice potentiel des interventions.
      </p>
    </div>

    <TrajectoryChart results={results} />
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
              <p className="text-xl font-bold text-white">{formatNumber(results.patient_age, 1)} ans</p>
            </div>
            <div className="p-3 bg-gray-800 rounded-lg">
              <p className="text-xs text-gray-400 mb-1">ANC</p>
              <p className="text-xl font-bold text-orange-500">{formatNumber(results.nca_prediction?.nca_predicted ?? 0, 1)} ans</p>
            </div>
            <div className="p-3 bg-gray-800 rounded-lg">
              <p className="text-xs text-gray-400 mb-1">Delta</p>
              <p className="text-xl font-bold text-orange-500">
                 {formatNumberWithSign(results.nca_prediction?.delta_nca ?? 0, 1)} ans
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
