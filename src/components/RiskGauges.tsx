
import { GaugeChart } from './GaugeChart'; // ← Utilise VOTRE composant existant

interface RiskGaugesProps {
  riskDementia: number;    // 0-100
  riskHandicap: number;    // 0-100
}

export function RiskGauges({ riskDementia, riskHandicap }: RiskGaugesProps) {
  return (
    <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
      {/* Titre de section */}
      <h3 className="text-xl font-semibold text-white mb-6">
        Évaluation des Risques
      </h3>

      {/* Grille 2 colonnes pour les gauges */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
        {/* Gauche : Risque de Démence */}
        <div className="space-y-3">
          <GaugeChart 
            value={riskDementia} 
            title="Risque de Démence" 
          />
          
          {/* Description du risque */}
          <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
            <p className="text-sm text-gray-300 leading-relaxed">
              Probabilité estimée de développer un trouble neurocognitif majeur 
              au cours des 5 prochaines années, basée sur l'âge cognitif, 
              les facteurs de risque cardiovasculaires et le mode de vie.
            </p>
          </div>
        </div>

        {/* Droite : Risque de Handicap */}
        <div className="space-y-3">
          <GaugeChart 
            value={riskHandicap} 
            title="Risque de Handicap Fonctionnel" 
          />
          
          {/* Description du risque */}
          <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
            <p className="text-sm text-gray-300 leading-relaxed">
              Probabilité estimée de perte d'autonomie dans les activités 
              quotidiennes au cours des 5 prochaines années, basée sur la 
              performance cognitive actuelle et les comorbidités physiques.
            </p>
          </div>
        </div>
      </div>

      {/* Légende commune des niveaux de risque */}
      <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
        <h4 className="text-sm font-semibold text-gray-300 mb-3">
          Interprétation des niveaux de risque :
        </h4>
        
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {/* Très faible */}
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded bg-green-500 flex-shrink-0"></div>
            <div className="text-xs">
              <div className="font-medium text-gray-300">Très faible</div>
              <div className="text-gray-500">&lt; 20%</div>
            </div>
          </div>

          {/* Faible */}
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded bg-lime-500 flex-shrink-0"></div>
            <div className="text-xs">
              <div className="font-medium text-gray-300">Faible</div>
              <div className="text-gray-500">20-40%</div>
            </div>
          </div>

          {/* Modéré */}
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded bg-yellow-500 flex-shrink-0"></div>
            <div className="text-xs">
              <div className="font-medium text-gray-300">Modéré</div>
              <div className="text-gray-500">40-60%</div>
            </div>
          </div>

          {/* Élevé */}
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded bg-orange-500 flex-shrink-0"></div>
            <div className="text-xs">
              <div className="font-medium text-gray-300">Élevé</div>
              <div className="text-gray-500">60-80%</div>
            </div>
          </div>

          {/* Très élevé */}
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded bg-red-500 flex-shrink-0"></div>
            <div className="text-xs">
              <div className="font-medium text-gray-300">Très élevé</div>
              <div className="text-gray-500">≥ 80%</div>
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