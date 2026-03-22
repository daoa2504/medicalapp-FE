/**
 * TrajectoryChart.tsx - MIS À JOUR
 * Affiche les trajectoires longitudinales avec données réelles
 */

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
  ReferenceDot,
} from 'recharts';
import { ExtendedPredictionOutput } from '../types';

interface TrajectoryChartProps {
  results: ExtendedPredictionOutput;
}

export function TrajectoryChart({ results }: TrajectoryChartProps) {
  console.log('=== DÉBOGAGE TRAJECTOIRE ===');
  console.log('Current:', results.trajectory?.current);
  console.log('Projected:', results.trajectory?.projected);
  console.log('Annual decline:', results.trajectory?.annual_decline);
  console.log('Historical:', results.trajectory?.historical?.slice(-3)); // 3 derniers points
  console.log('============================');
  // =========================================
  
 
  
  if (!results.trajectory) {
    return <div className="text-gray-400">Données de trajectoire non disponibles</div>;
  }

  const { historical, current, projected, normative, example_trajectories } = results.trajectory;

  // Combiner toutes les trajectoires du patient
  const allData = [
    ...historical.map(p => ({
      year: p.year,
      delta_nca: p.delta_nca,
      type: 'historical',
    })),
    {
      year: current.year,
      delta_nca: current.delta_nca,
      type: 'current',
    },
    ...projected.map(p => ({
      year: p.year,
      delta_nca: p.delta_nca,
      ci_lower: p.ci_lower,
      ci_upper: p.ci_upper,
      type: 'projected',
    })),
  ];

  // Données normatives
  const normativeData = normative.map(n => ({
    year: n.year,
    p25: n.p25,
    p75: n.p75,
    median: n.median,
  }));

  // Point actuel
  const currentPoint = {
    year: current.year,
    delta_nca: current.delta_nca,
  };

  // Couleurs pour les trajectoires d'exemple
  const exampleColors = ['#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b'];

  return (
    <div className="space-y-4">
      {/* Graphique principal */}
      <ResponsiveContainer width="100%" height={450}>
        <LineChart
          margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
        >
          <defs>
            <linearGradient id="normativeGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6b7280" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#6b7280" stopOpacity={0.1} />
            </linearGradient>
            <linearGradient id="ciGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f97316" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#f97316" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          
          <XAxis
            dataKey="year"
            type="number"
            domain={['dataMin', 'dataMax']}
            stroke="#9ca3af"
            label={{ 
              value: 'Années écoulées (0 = aujourd\'hui)', 
              position: 'insideBottom', 
              offset: -10,
              fill: '#9ca3af' 
            }}
          />
          
          <YAxis
            stroke="#9ca3af"
            label={{ 
              value: 'Delta NCA (vieillissement neurocognitif, années)', 
              angle: -90, 
              position: 'insideLeft',
              fill: '#9ca3af'
            }}
          />
          
 <Tooltip
  contentStyle={{
    backgroundColor: '#1f2937',
    border: '1px solid #374151',
    borderRadius: '8px',
    color: '#fff'
  }}
  content={({ active, payload, label }) => {
    if (!active || !payload || payload.length === 0) return null;
    
    // Chercher spécifiquement la ligne du patient (orange)
    const patientData = payload.find(p => 
      p.dataKey === 'delta_nca' && 
      (p.stroke === '#f97316' || p.name?.includes('historique') || p.name?.includes('Projection'))
    );
    
    // Si on trouve les données du patient
    if (patientData && patientData.payload) {
      const point = patientData.payload;
      const value = point.delta_nca;
      
      return (
        <div className="bg-gray-900 p-3 rounded-lg border border-gray-700">
          <p className="text-sm font-semibold text-orange-400">
            Année : {point.year > 0 ? '+' : ''}{point.year}
          </p>
          <p className="text-sm text-gray-300">
            Delta NCA : {value?.toFixed(1) || 'N/A'} ans
          </p>
          {point.ci_lower !== undefined && point.ci_upper !== undefined && (
            <p className="text-xs text-gray-400">
              IC : [{point.ci_lower.toFixed(1)}, {point.ci_upper.toFixed(1)}]
            </p>
          )}
          <p className="text-xs text-gray-500 mt-1">Votre patient</p>
        </div>
      );
    }
    
    // Sinon afficher toutes les valeurs disponibles
    return (
      <div className="bg-gray-900 p-3 rounded-lg border border-gray-700">
        <p className="text-sm font-semibold mb-2">Année : {label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-xs" style={{ color: entry.color }}>
            {entry.name}: {entry.value?.toFixed(1)} ans
          </p>
        ))}
      </div>
    );
  }}
/>     
          <Legend
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="line"
          />

          {/* Zone normative (25ème-75ème percentile) */}
          <Area
            data={normativeData}
            type="monotone"
            dataKey="p75"
            stroke="none"
            fill="url(#normativeGradient)"
            name="Zone normative (25°-75°)"
          />
          <Area
            data={normativeData}
            type="monotone"
            dataKey="p25"
            stroke="none"
            fill="#000"
            name=""
          />

          {/* Médiane de la population */}
          <Line
            data={normativeData}
            type="monotone"
            dataKey="median"
            stroke="#6b7280"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={false}
            name="Médiane population"
          />

          {/* Intervalle de confiance de la projection */}
          <Area
            data={allData.filter(d => d.type === 'projected')}
            type="monotone"
            dataKey="ci_upper"
            stroke="none"
            fill="url(#ciGradient)"
            name="Intervalle confiance"
          />
          <Area
            data={allData.filter(d => d.type === 'projected')}
            type="monotone"
            dataKey="ci_lower"
            stroke="none"
            fill="#000"
            name=""
          />

          {/* Trajectoires d'exemple (patients similaires réels) */}
          {example_trajectories && example_trajectories.map((traj: any, idx: number) => {
            const trajData = traj.points.map((p: any) => ({
              year: p.year - current.year,  // Recentrer sur le présent
              delta_nca: p.delta_nca
            }));
            
            return (
              <Line
                key={`example-${idx}`}
                data={trajData}
                type="monotone"
                dataKey="delta_nca"
                stroke={exampleColors[idx % exampleColors.length]}
                strokeWidth={1.5}
                strokeOpacity={0.4}
                dot={false}
                name={`Patient ${traj.diagnosis} (réel)`}
              />
            );
          })}

          {/* Trajectoire historique du patient */}
          <Line
            data={allData.filter(d => d.type === 'historical' || d.type === 'current')}
            type="monotone"
            dataKey="delta_nca"
            stroke="#f97316"
            strokeWidth={3}
            dot={false}
            name="Trajectoire historique"
          />

          {/* Trajectoire projetée */}
          <Line
            data={allData.filter(d => d.type === 'current' || d.type === 'projected')}
            type="monotone"
            dataKey="delta_nca"
            stroke="#f97316"
            strokeWidth={3}
            strokeDasharray="5 5"
            dot={false}
            name="Projection 5 ans"
          />

          {/* Point actuel mis en évidence */}
          <ReferenceDot
            x={currentPoint.year}
            y={currentPoint.delta_nca}
            r={8}
            fill="#f97316"
            stroke="#fff"
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>

      {/* Informations sur la trajectoire */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 bg-gray-800 rounded-lg">
          <p className="text-xs text-gray-400 mb-1">Delta NCA actuel</p>
          <p className="text-2xl font-bold text-orange-500">
            {current.delta_nca > 0 ? '+' : ''}
            {current.delta_nca.toFixed(1)} ans
          </p>
        </div>
      <div className="p-4 bg-gray-800 rounded-lg">
  <p className="text-xs text-gray-400 mb-1">Projection à 5 ans</p>
  <p className="text-2xl font-bold text-orange-400">
    {projected[projected.length - 1].delta_nca > 0 ? '+' : ''}
    {projected[projected.length - 1].delta_nca.toFixed(1)} ans
  </p>
{(() => {
  const lastProjected = projected[projected.length - 1];
  return lastProjected.ci_lower !== undefined && lastProjected.ci_upper !== undefined ? (
    <p className="text-xs text-gray-500 mt-1">
      IC: {lastProjected.ci_lower.toFixed(1)} à {lastProjected.ci_upper.toFixed(1)}
    </p>
  ) : null;
})()}
</div>
        
        <div className="p-4 bg-gray-800 rounded-lg">
          <p className="text-xs text-gray-400 mb-1">Taux de déclin</p>
          <p className="text-2xl font-bold text-red-400">
            +{results.trajectory.annual_decline.toFixed(2)} ans/an
          </p>
          <p className="text-xs text-gray-500 mt-1">
            ± {results.trajectory.decline_ci.toFixed(2)} ans/an
          </p>
        </div>
      </div>

      {/* Message d'interprétation */}
      <div className="p-4 bg-blue-900/20 border border-blue-900 rounded-lg">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="text-sm text-blue-400 font-semibold mb-1">
              Interprétation basée sur {example_trajectories?.length || 0} patients similaires réels
            </p>
            <p className="text-sm text-blue-300">
              La zone grisée représente le vieillissement neurocognitif normal (25ème-75ème percentile). 
              Les lignes colorées fines montrent les trajectoires réelles de patients similaires dans la cohorte.
              Le patient évolue actuellement{' '}
              {current.delta_nca > (normative[Math.floor(normative.length / 2)]?.median || 0)
                ? 'au-dessus' 
                : 'en dessous'
              } de la médiane de la population.
            </p>
          </div>
        </div>
      </div>

      {/* Indicateur de données réelles */}
      {results.trajectory.based_on_real_data && (
        <div className="p-3 bg-green-900/20 border border-green-900 rounded-lg">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <p className="text-sm text-green-400 font-semibold">
              Prédictions basées sur données longitudinales réelles
            </p>
          </div>
        </div>
      )}
    </div>
  );
}