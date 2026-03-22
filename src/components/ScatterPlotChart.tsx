import { useState } from 'react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Line,
  LineChart,
  ReferenceDot,
} from 'recharts';
import { ExtendedPredictionOutput, ReferenceSubject } from '../types';
import { formatNumber, formatNumberWithSign, formatInteger } from "../utils/numberFormat";

interface ScatterPlotChartProps {
  results: ExtendedPredictionOutput;
}

export function ScatterPlotChart({ results }: ScatterPlotChartProps) {
  const [filters, setFilters] = useState({
    ageGroup: 'all', // all, <60, 60-80, >80
    sex: 'all', // all, 0, 1
    education: 'all', // all, 0-4
    diagnosis: 'all', // all, CON, MCI, AD, OTHER_DEM, SCD
  });

  // Filtrer les données de la cohorte de référence
  const filteredCohort = (results.reference_cohort || []).filter((subject: ReferenceSubject) => {
    if (filters.ageGroup !== 'all') {
      if (filters.ageGroup === '<60' && subject.age >= 60) return false;
      if (filters.ageGroup === '60-80' && (subject.age < 60 || subject.age > 80)) return false;
      if (filters.ageGroup === '>80' && subject.age <= 80) return false;
    }
    if (filters.sex !== 'all' && subject.sex !== Number(filters.sex)) return false;
    if (filters.education !== 'all' && subject.education_group !== Number(filters.education)) return false;
    if (filters.diagnosis !== 'all' && subject.dementia_dx_code !== filters.diagnosis) return false;
    return true;
  });

  // Préparer les données pour le scatter plot
  const scatterData = filteredCohort.map((subject: ReferenceSubject) => ({
    age: subject.age,
    nca: subject.neurocog_age_flu_weight,
    diagnosis: subject.dementia_dx_code,
  }));

  // Point du patient
  const patientPoint = {
    age: results.age,
    nca: results.neurocog_age_flu_weight,
  };

  // Couleurs par diagnostic
  const diagnosisColors: Record<string, string> = {
    CON: '#22c55e',      // Vert
    SCD: '#84cc16',      // Vert-jaune
    MCI: '#eab308',      // Jaune
    AD: '#ef4444',       // Rouge
    OTHER_DEM: '#f97316' // Orange
  };

  return (
    <div className="space-y-4">
      {/* Filtres */}
      <div className="flex flex-wrap gap-4 p-4 bg-gray-800 rounded-lg">
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-400">Âge :</label>
          <select
            value={filters.ageGroup}
            onChange={(e) => setFilters({ ...filters, ageGroup: e.target.value })}
            className="bg-gray-700 text-white px-3 py-1 rounded text-sm"
          >
            <option value="all">Tous âges</option>
            <option value="<60">&lt; 60 ans</option>
            <option value="60-80">60-80 ans</option>
            <option value=">80">&gt; 80 ans</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-400">Sexe :</label>
          <select
            value={filters.sex}
            onChange={(e) => setFilters({ ...filters, sex: e.target.value })}
            className="bg-gray-700 text-white px-3 py-1 rounded text-sm"
          >
            <option value="all">Tous</option>
            <option value="0">Femme</option>
            <option value="1">Homme</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-400">Diagnostic :</label>
          <select
            value={filters.diagnosis}
            onChange={(e) => setFilters({ ...filters, diagnosis: e.target.value })}
            className="bg-gray-700 text-white px-3 py-1 rounded text-sm"
          >
            <option value="all">Tous</option>
            <option value="CON">Non atteint (CON)</option>
            <option value="SCD">Déclin subjectif (SCD)</option>
            <option value="MCI">Trouble léger (MCI)</option>
            <option value="AD">Alzheimer (AD)</option>
            <option value="OTHER_DEM">Autres démences</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-400">Éducation :</label>
          <select
            value={filters.education}
            onChange={(e) => setFilters({ ...filters, education: e.target.value })}
            className="bg-gray-700 text-white px-3 py-1 rounded text-sm"
          >
            <option value="all">Tous niveaux</option>
            <option value="0">Pré-primaire</option>
            <option value="1">Primaire</option>
            <option value="2">Secondaire inf.</option>
            <option value="3">Secondaire sup.</option>
            <option value="4">Universitaire</option>
          </select>
        </div>
      </div>

      {/* Graphique */}
      <ResponsiveContainer width="100%" height={500}>
        <ScatterChart margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          
          <XAxis
            type="number"
            dataKey="age"
            name="Âge chronologique"
            stroke="#9ca3af"
            label={{ 
              value: 'Âge chronologique (années)', 
              position: 'insideBottom', 
              offset: -10,
              fill: '#9ca3af'
            }}
            domain={[50, 90]}
          />
          
          <YAxis
            type="number"
            dataKey="nca"
            name="Âge neurocognitif"
            stroke="#9ca3af"
            label={{ 
              value: 'Âge neurocognitif (années)', 
              angle: -90, 
              position: 'insideLeft',
              fill: '#9ca3af'
            }}
            domain={[40, 100]}
          />
          
          <Tooltip
            contentStyle={{
              backgroundColor: '#1f2937',
              border: '1px solid #374151',
              borderRadius: '8px',
              color: '#fff'
            }}
            cursor={{ strokeDasharray: '3 3' }}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload;
                return (
                  <div className="bg-gray-900 p-3 rounded-lg border border-gray-700">
                    <p className="text-sm text-gray-400">Âge chronologique: {formatInteger(data?.age)} ans</p>
                    <p className="text-sm text-gray-400">Âge neurocognitif: {formatNumber(data?.nca, 1)} ans</p>
                    {data.diagnosis && (
                      <p className="text-sm text-gray-400">Diagnostic: {data.diagnosis}</p>
                    )}
                  </div>
                );
              }
              return null;
            }}
          />
          
          <Legend
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="circle"
          />

          {/* Ligne de référence (y = x) */}
          <Line
            type="monotone"
            dataKey="age"
            data={[{ age: 40 }, { age: 100 }]}
            stroke="#6b7280"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={false}
            name="Ligne de référence (âge = NCA)"
          />

          {/* Points de la cohorte par diagnostic */}
          {Object.keys(diagnosisColors).map((dx) => {
            const dxData = scatterData.filter((d: any) => d.diagnosis === dx);
            if (dxData.length === 0) return null;
            
            return (
              <Scatter
                key={dx}
                name={dx}
                data={dxData}
                fill={diagnosisColors[dx]}
                opacity={0.6}
              />
            );
          })}

          {/* Point du patient */}
          <Scatter
            name="Patient actuel"
            data={[patientPoint]}
            fill="#f97316"
            shape="star"
          >
            <ReferenceDot
              x={patientPoint.age}
              y={patientPoint.nca}
              r={10}
              fill="#f97316"
              stroke="#fff"
              strokeWidth={3}
            />
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>

      {/* Légende personnalisée */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span className="text-gray-400">CON - Non atteint</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-lime-500" />
          <span className="text-gray-400">SCD - Déclin subjectif</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-yellow-500" />
          <span className="text-gray-400">MCI - Trouble léger</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span className="text-gray-400">AD - Alzheimer</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-orange-500" />
          <span className="text-gray-400">OTHER - Autres démences</span>
        </div>
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-orange-500" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
          <span className="text-gray-400">Votre patient</span>
        </div>
      </div>

      {/* Informations patient - ✅ CORRIGÉ */}
      <div className="mt-4 p-4 bg-gray-800 rounded-lg">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-sm text-gray-400">Âge chronologique</p>
            <p className="text-2xl font-bold text-white">{results.age} ans</p>
          </div>
          <div>
            <p className="text-sm text-gray-400">Âge neurocognitif</p>
            <p className="text-2xl font-bold text-orange-500">
              {formatNumber(results.neurocog_age_flu_weight, 1)} ans
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-400">Delta NCA</p>
            <p className="text-2xl font-bold text-orange-500">
              {formatNumberWithSign(results.delta_neurocogage_flu_weight, 1)} ans
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}