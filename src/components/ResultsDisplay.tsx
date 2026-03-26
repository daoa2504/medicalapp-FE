// ResultsDisplay.tsx - VERSION AVEC NCA INTÉGRÉ
import { useMemo, useState } from "react";
import { ExtendedPredictionOutput } from "../types";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

import { ScatterPlotChart } from "./ScatterPlotChart";
import { TrajectoryChart } from "./TrajectoryChart";


// import { RiskFactorsPanel } from "./RiskFactorsPanel";
// import { DiagnosticZonesChart } from "./DiagnosticZonesChart";
// import { GrowthCurveChart } from "./GrowthCurveChart";
import { formatNumber, formatNumberWithSign } from "../utils/numberFormat";

interface ResultsDisplayProps {
  results: ExtendedPredictionOutput;
  onBack: () => void;
}

type TabKey = "position" | "trajectory";
// | "percentiles" | "centiles"  — désactivés temporairement

export function ResultsDisplay({ results, onBack }: ResultsDisplayProps) {
  console.log("RESULTS 👉", results);
  const [activeTab, setActiveTab] = useState<TabKey>("position");

  // Remount key : force le montage du chart quand on change d'onglet
  const chartKey = useMemo(
    () => `chart-${activeTab}-${results?.identifier ?? "x"}`,
    [activeTab, results?.identifier]
  );



  return (
    <div className="space-y-6">

      {/* ── Navigation ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <Button onClick={onBack} variant="outline" className="border-gray-700">
          ← Retour au formulaire
        </Button>
        <div className="text-sm text-gray-400">
          Patient : <span className="text-white font-semibold">{results.identifier}</span>
        </div>
      </div>

      {/* ── Onglets (pleine largeur) ────────────────────────────────────────── */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <div>
            <CardTitle className="text-xl">Évaluation Neurocognitive</CardTitle>
            <p className="text-sm text-gray-400 mt-1">
              {activeTab === "position"
                ? "Positionnement dans la cohorte de référence"
                : "Trajectoire temporelle du vieillissement neurocognitif"}
            </p>
          </div>
        </CardHeader>

        <CardContent className="min-w-0">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabKey)}>
            <TabsList className="grid w-full grid-cols-2 bg-gray-800 mb-6">
              <TabsTrigger value="position">📊 Estimations et détection</TabsTrigger>
              <TabsTrigger value="trajectory">📈 Projection et potentiel d'amélioration</TabsTrigger>
              {/* <TabsTrigger value="percentiles">🧭 Zones</TabsTrigger> */}
              {/* <TabsTrigger value="centiles">📉 Centiles</TabsTrigger> */}
            </TabsList>

            {/* Module 1 */}
            <TabsContent value="position" className="min-w-0 min-h-[560px]">
              <div className="space-y-4 min-w-0">
                <div className="p-4 bg-blue-900/20 border border-blue-900 rounded-lg">
                  <p className="text-sm text-blue-400">
                    <strong>Objectif :</strong> Situer le patient par rapport à la cohorte de référence
                    et identifier immédiatement les écarts entre l'âge chronologique et l'âge neurocognitif.
                  </p>
                </div>
                <div className="min-w-0">
                  <ScatterPlotChart key={chartKey} results={results} />
                </div>
              </div>
            </TabsContent>

            {/* Module 2 */}
            <TabsContent value="trajectory" className="min-w-0 min-h-[560px]">
              <div className="space-y-6">
                <div className="p-4 bg-purple-900/20 border border-purple-900 rounded-lg">
                  <p className="text-sm text-purple-400">
                    <strong>Objectif :</strong> Estimer l'évolution future du vieillissement
                    neurocognitif et visualiser le bénéfice potentiel des interventions.
                  </p>
                </div>
                <TrajectoryChart results={results} />
              </div>
            </TabsContent>

            {/* ── Zones diagnostiques — désactivé ──
            <TabsContent value="percentiles" className="min-w-0 min-h-[620px]">
              ...
            </TabsContent>
            ── */}

            {/* ── Courbes de centiles — désactivé ──
            <TabsContent value="centiles" className="min-w-0 min-h-[620px]">
              ...
            </TabsContent>
            ── */}
          </Tabs>
        </CardContent>
      </Card>

      {/* ── Potentiel d'amélioration (pleine largeur) ──────────────────────── */}
      

      {/* ── Explainable AI (pleine largeur) ────────────────────────────────── */}
      {/* <ExplainableAI results={results} /> */}

      {/* ── Synthèse clinique (pleine largeur) ─────────────────────────────── */}
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
              <p className="text-xl font-bold text-orange-500">
                {formatNumber(results.nca_prediction?.nca_predicted ?? 0, 1)} ans
              </p>
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
                {results.model_type === "model_1"
                  ? "Basique"
                  : results.model_type === "model_2"
                  ? "Complet"
                  : "Avancé"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Panel droit — désactivé temporairement ─────────────────────────── */}
      {/* <div className="lg:col-span-1 min-w-0">
        <RiskFactorsPanel />
      </div> */}

    </div>
  );
}