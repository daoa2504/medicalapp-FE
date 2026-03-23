/**
 * PercentileCurveChartWithFilters.tsx - VERSION SIMPLIFIÉE
 * Graphique plus lisible avec moins de bruit visuel
 */

import { useState, useMemo } from 'react';
import {
  
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  ComposedChart,
} from 'recharts';
import { ExtendedPredictionOutput } from '../types';

interface PercentileCurveChartWithFiltersProps {
  results: ExtendedPredictionOutput;
}

// Couleurs par diagnostic
const DIAGNOSIS_COLORS = {
  CON: '#22c55e',
  SCD: '#06b6d4',
  MCI: '#eab308',
  AD: '#ef4444',
  OTHER_DEM: '#a855f7',
};

const DIAGNOSIS_LABELS = {
  CON: 'CON (Sain)',
  SCD: 'SCD (Subjectif)',
  MCI: 'MCI (Léger)',
  AD: 'AD (Alzheimer)',
  OTHER_DEM: 'Autres démences',
};

export function PercentileCurveChartWithFilters({ results }: PercentileCurveChartWithFiltersProps) {
  // États des filtres
  const [sexFilter, setSexFilter] = useState<'all' | 'male' | 'female'>('all');
  const [diagnosisFilter, setDiagnosisFilter] = useState<'all' | 'CON' | 'SCD' | 'MCI' | 'AD' | 'OTHER_DEM'>('all');

  if (!results.percentile_curves) {
    return (
      <div className="text-gray-400 text-center p-8">
        Données de percentiles non disponibles
      </div>
    );
  }

  const { male, female, patient_trajectory, patient_sex } = results.percentile_curves;

  // Calculer les courbes à afficher selon les filtres
  const displayedCurves = useMemo(() => {
    if (sexFilter === 'all') {
      return { male: male || [], female: female || [] };
    } else if (sexFilter === 'male') {
      return { male: male || [], female: [] };
    } else {
      return { male: [], female: female || [] };
    }
  }, [sexFilter, male, female]);

  // Filtrer les trajectoires d'exemple - LIMITÉ À 1 PAR DIAGNOSTIC
  const filteredTrajectories = useMemo(() => {
    if (!results.diagnosis_trajectories) return {};
    
    const filtered: any = {};
    
    if (diagnosisFilter === 'all') {
      // Prendre seulement 1 trajectoire par diagnostic
      Object.keys(results.diagnosis_trajectories).forEach(dx => {
        const trajectories = results.diagnosis_trajectories![dx as keyof typeof results.diagnosis_trajectories];
        filtered[dx] = trajectories ? [trajectories[0]] : [];
      });
    } else {
      // Prendre 1 trajectoire du diagnostic sélectionné
      const trajectories = results.diagnosis_trajectories[diagnosisFilter];
      filtered[diagnosisFilter] = trajectories ? [trajectories[0]] : [];
    }
    
    return filtered;
  }, [diagnosisFilter, results.diagnosis_trajectories]);

  const currentPoint = patient_trajectory.find(p => p.type === 'current');

  return (
    <div className="space-y-4">
      {/* Titre */}
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold text-white mb-2">
          Courbes de Percentiles
        </h3>
        <p className="text-sm text-gray-400">
          Filtrez pour affiner la comparaison
        </p>
      </div>

      {/* Filtres */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-800 rounded-lg border border-gray-700">
        {/* Filtre Sexe */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Filtrer par sexe
          </label>
          <select
            value={sexFilter}
            onChange={(e) => setSexFilter(e.target.value as any)}
            className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Tous les sexes</option>
            <option value="male">👨 Hommes uniquement</option>
            <option value="female">👩 Femmes uniquement</option>
          </select>
        </div>

        {/* Filtre Diagnostic */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Filtrer par diagnostic
          </label>
          <select
            value={diagnosisFilter}
            onChange={(e) => setDiagnosisFilter(e.target.value as any)}
            className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Tous les diagnostics</option>
            <option value="CON">🟢 CON - Cognitivement sain</option>
            <option value="SCD">🔵 SCD - Déclin subjectif</option>
            <option value="MCI">🟡 MCI - Trouble léger</option>
            <option value="AD">🔴 AD - Alzheimer</option>
            <option value="OTHER_DEM">🟣 Autres démences</option>
          </select>
        </div>
      </div>

      {/* Graphique principal */}
      <ResponsiveContainer width="100%" height={500}>
        <ComposedChart
          margin={{ top: 20, right: 30, left: 20, bottom: 50 }}
        >
          <defs>
            {/* Gradients pour zones normatives */}
            <linearGradient id="maleZone" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.25} />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.05} />
            </linearGradient>
            <linearGradient id="femaleZone" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ec4899" stopOpacity={0.25} />
              <stop offset="100%" stopColor="#ec4899" stopOpacity={0.05} />
            </linearGradient>
          </defs>

          <CartesianGrid stroke="#374151" strokeDasharray="3 3" />

          <XAxis
            dataKey="age"
            type="number"
            domain={[50, 90]}
            stroke="#9ca3af"
            label={{
              value: 'Âge (années)',
              position: 'insideBottom',
              offset: -15,
              fill: '#9ca3af',
              fontSize: 14,
            }}
          />

          <YAxis
            stroke="#9ca3af"
            label={{
              value: 'Delta NCA (années)',
              angle: -90,
              position: 'insideLeft',
              fill: '#9ca3af',
              fontSize: 14,
            }}
          />

          <Tooltip
            contentStyle={{
              backgroundColor: '#1f2937',
              border: '1px solid #374151',
              borderRadius: '8px',
              color: '#fff',
            }}
            content={({ active, payload }) => {
              if (!active || !payload || payload.length === 0) return null;
              
              // Chercher le point du patient
              const patientPoint = payload.find(p => p.dataKey === 'delta_nca');
              
              if (patientPoint && patientPoint.payload) {
                return (
                  <div className="bg-gray-900 p-3 rounded-lg border border-gray-700">
                    <p className="text-sm font-semibold text-white mb-2">
                      Âge : {patientPoint.payload.age} ans
                    </p>
                    <p className="text-sm text-orange-400 font-semibold">
                      Votre patient : {patientPoint.value?.toFixed(1)} ans
                    </p>
                  </div>
                );
              }
              
              return null;
            }}
          />

          <Legend
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="line"
          />

          {/* Zone normative (25-75e percentile) pour hommes */}
          {displayedCurves.male.length > 0 && (
            <>
              <Area
                data={displayedCurves.male}
                type="monotone"
                dataKey="p75"
                stroke="none"
                fill="url(#maleZone)"
              />
              <Area
                data={displayedCurves.male}
                type="monotone"
                dataKey="p25"
                stroke="none"
                fill="#000"
              />
              <Line
                data={displayedCurves.male}
                type="monotone"
                dataKey="p50"
                stroke="#3b82f6"
                strokeWidth={3}
                dot={false}
                name="Médiane Hommes"
              />
            </>
          )}

          {/* Zone normative (25-75e percentile) pour femmes */}
          {displayedCurves.female.length > 0 && (
            <>
              <Area
                data={displayedCurves.female}
                type="monotone"
                dataKey="p75"
                stroke="none"
                fill="url(#femaleZone)"
              />
              <Area
                data={displayedCurves.female}
                type="monotone"
                dataKey="p25"
                stroke="none"
                fill="#000"
              />
              <Line
                data={displayedCurves.female}
                type="monotone"
                dataKey="p50"
                stroke="#ec4899"
                strokeWidth={3}
                dot={false}
                name="Médiane Femmes"
              />
            </>
          )}

          {/* Trajectoires d'exemple par diagnostic (1 SEULE PAR DIAGNOSTIC) */}
{Object.entries(filteredTrajectories).map(([diagnosis, trajectories]: [string, any]) => {
  if (!trajectories || trajectories.length === 0) return null;

  const trajectory = trajectories[0]; // Prendre seulement la première
  if (!trajectory || !trajectory.points) return null;  // ← NOUVELLE LIGNE
  
  return (
    <Line
      key={`${diagnosis}-0`}
      data={trajectory.points}
      type="monotone"
      dataKey="delta_nca"
      stroke={DIAGNOSIS_COLORS[diagnosis as keyof typeof DIAGNOSIS_COLORS]}
      strokeWidth={2}
      strokeOpacity={0.5}
      dot={false}
      name={DIAGNOSIS_LABELS[diagnosis as keyof typeof DIAGNOSIS_LABELS]}
    />
  );
})}

          {/* Trajectoire du patient (ÉPAISSE ET VISIBLE) */}
          <Line
            data={patient_trajectory}
            type="monotone"
            dataKey="delta_nca"
            stroke="#ff6b00"
            strokeWidth={5}
            dot={{
              fill: '#ff6b00',
              stroke: '#fff',
              strokeWidth: 3,
              r: 8,
            }}
            name="VOTRE PATIENT"
          />
        </ComposedChart>
      </ResponsiveContainer>

      {/* Légende simplifiée */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-1 bg-orange-500" style={{ height: '4px' }} />
          <span className="text-sm font-semibold text-orange-500">Votre patient</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-1 bg-blue-500" style={{ height: '3px' }} />
          <span className="text-xs text-gray-300">Médiane Hommes</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-1 bg-pink-500" style={{ height: '3px' }} />
          <span className="text-xs text-gray-300">Médiane Femmes</span>
        </div>
      </div>

      {/* Position du patient */}
      {currentPoint && (
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 bg-gray-800 rounded-lg">
            <p className="text-xs text-gray-400 mb-1">Sexe du patient</p>
            <p className="text-2xl font-bold" style={{ color: patient_sex === 1 ? '#3b82f6' : '#ec4899' }}>
              {patient_sex === 1 ? '👨 Homme' : '👩 Femme'}
            </p>
          </div>
          <div className="p-4 bg-gray-800 rounded-lg">
            <p className="text-xs text-gray-400 mb-1">Delta NCA actuel</p>
            <p className="text-2xl font-bold text-orange-500">
              {currentPoint.delta_nca > 0 ? '+' : ''}
              {currentPoint.delta_nca.toFixed(1)} ans
            </p>
          </div>
          <div className="p-4 bg-gray-800 rounded-lg">
            <p className="text-xs text-gray-400 mb-1">Âge actuel</p>
            <p className="text-2xl font-bold text-white">
              {currentPoint.age} ans
            </p>
          </div>
        </div>
      )}

      {/* Aide à l'interprétation */}
      <div className="p-4 bg-blue-900/20 border border-blue-900 rounded-lg">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="text-sm text-blue-400 font-semibold mb-1">
              Comment lire ce graphique ?
            </p>
            <p className="text-sm text-blue-300">
              La <strong>ligne orange épaisse</strong> montre l'évolution de votre patient. 
              Les <strong>zones colorées</strong> (bleue/rose) représentent le vieillissement normal pour chaque sexe (25e-75e percentile). 
              Les <strong>lignes fines</strong> montrent des exemples de patients avec différents diagnostics.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}