import { GaugeChart } from './GaugeChart';

interface RiskGaugesProps {
  riskDementia: number;    // 0-100
}

export function RiskGauges({ riskDementia }: RiskGaugesProps) {
  return (
    <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
      {/* Titre de section */}
      <h3 className="text-xl font-semibold text-white mb-6">
        Évaluation des Risques
      </h3>

      {/* Jauge unique centrée */}
      <div className="max-w-md mx-auto mb-6">
        <GaugeChart 
          value={riskDementia} 
          title="Risque de trouble neurocognitif" 
        />
      </div>

      {/* Description du risque */}
      <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700 mb-6">
        <p className="text-sm text-gray-300 leading-relaxed text-center">
          Probabilité estimée de développer un trouble neurocognitif au cours des 5 prochaines années, basée sur l'âge neurocognitif et les facteurs personnels renseignés.
        </p>
      </div>

      {/* Légende des niveaux de risque - 3 niveaux */}
      <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
        <h4 className="text-sm font-semibold text-gray-300 mb-3">
          Interprétation des niveaux de risque :
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Faible */}
          <div className="flex items-center space-x-3">
            <div className="w-5 h-5 rounded bg-green-500 flex-shrink-0"></div>
            <div className="text-sm">
              <div className="font-medium text-gray-300">Faible</div>
              <div className="text-gray-500">0-30%</div>
            </div>
          </div>

          {/* Modéré */}
          <div className="flex items-center space-x-3">
            <div className="w-5 h-5 rounded bg-yellow-500 flex-shrink-0"></div>
            <div className="text-sm">
              <div className="font-medium text-gray-300">Modéré</div>
              <div className="text-gray-500">30-60%</div>
            </div>
          </div>

          {/* Élevé */}
          <div className="flex items-center space-x-3">
            <div className="w-5 h-5 rounded bg-red-500 flex-shrink-0"></div>
            <div className="text-sm">
              <div className="font-medium text-gray-300">Élevé</div>
              <div className="text-gray-500">&gt; 60%</div>
            </div>
          </div>
        </div>

        {/* Note informative */}
        <div className="mt-4 pt-3 border-t border-gray-700">
          <p className="text-xs text-gray-400 italic">
            💡 Ces estimations sont basées sur des modèles prédictifs ML entraînés 
            sur une cohorte de recherche et ne constituent pas un diagnostic médical. 
            Consultez un professionnel de la santé pour une évaluation personnalisée.
          </p>
        </div>
      </div>
    </div>
  );
}