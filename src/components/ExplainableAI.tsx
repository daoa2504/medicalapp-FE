import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { PredictionOutput } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { formatNumber, formatNumberWithSign } from '../utils/numberFormat';

interface ExplainableAIProps {
    results: PredictionOutput;
}

export function ExplainableAI({ results }: ExplainableAIProps) {
    // Simulated SHAP values - in production, these would come from the backend
    const shapData = [
        { factor: 'Sommeil', impact: -2.1, type: 'risk' },
        { factor: 'Isolement', impact: -1.5, type: 'risk' },
        { factor: 'Activité', impact: 0.8, type: 'protective' },
        { factor: 'Finance', impact: -0.8, type: 'risk' },
        { factor: 'Hypertension', impact: -0.4, type: 'risk' },
        { factor: 'Éducation', impact: 0.4, type: 'protective' },
        { factor: 'Vit Seul', impact: -0.3, type: 'risk' },
        { factor: 'Langues', impact: 0.2, type: 'protective' },
    ].sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact));

    // Calculate total adjustment
    const totalRiskFactors = shapData
        .filter(d => d.type === 'risk')
        .reduce((sum, d) => sum + Math.abs(d.impact), 0);

    const totalProtective = shapData
        .filter(d => d.type === 'protective')
        .reduce((sum, d) => sum + d.impact, 0);

    return (
        <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
                <CardTitle className="text-xl">Pourquoi ce Résultat ? (Explainable AI)</CardTitle>
                <p className="text-sm text-gray-400 mt-2">
                    L'ANC est ajusté de{' '}
                    <span className="text-orange-500 font-semibold">
                        {formatNumberWithSign(results.delta_neurocogage_flu_weight, 1)} ans
                    </span>{' '}
                    principalement à cause de :
                    <span className="text-red-400 font-semibold">
                        {' '}Sommeil (-2.1), Isolement (-1.5), Activité (-0.8)
                    </span>
                    . La réserve cognitive (Éducation/Langues) compense actuellement de{' '}
                    <span className="text-green-400 font-semibold">
                        -{formatNumber(totalProtective, 1)} ans
                    </span>.
                </p>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                        data={shapData}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal={false} />
                        <XAxis
                            type="number"
                            stroke="#9ca3af"
                            domain={[-3, 1]}
                            ticks={[-3, -2, -1, 0, 1]}
                            label={{ value: 'Impact sur l\'âge neurocognitif (années)', position: 'insideBottom', offset: -5, fill: '#9ca3af' }}
                        />
                        <YAxis
                            type="category"
                            dataKey="factor"
                            stroke="#9ca3af"
                            width={90}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#1f2937',
                                border: '1px solid #374151',
                                borderRadius: '8px',
                                color: '#fff'
                            }}
                            formatter={(value: any) => [
                                `${formatNumberWithSign(value, 1)} ans`,
                                'Impact'
                            ]}
                        />
                        <Bar dataKey="impact" radius={[0, 4, 4, 0]}>
                            {shapData.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={entry.type === 'risk' ? '#f97316' : '#22c55e'}
                                />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>

                {/* Legend */}
                <div className="mt-4 flex items-center justify-center gap-6 text-sm">
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-orange-500" />
                        <span className="text-gray-400">Facteurs de risque</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-green-500" />
                        <span className="text-gray-400">Facteurs protecteurs</span>
                    </div>
                </div>

                {/* Summary boxes */}
                <div className="grid grid-cols-2 gap-4 mt-6">
                    <div className="p-4 bg-red-900/20 border border-red-900 rounded-lg">
                        <p className="text-xs text-red-400 mb-1">Impact négatif total</p>
                        <p className="text-2xl font-bold text-red-400">
                            -{formatNumber(totalRiskFactors, 1)} ans
                        </p>
                        <p className="text-xs text-gray-400 mt-2">
                            Facteurs de risque modifiables
                        </p>
                    </div>
                    <div className="p-4 bg-green-900/20 border border-green-900 rounded-lg">
                        <p className="text-xs text-green-400 mb-1">Protection actuelle</p>
                        <p className="text-2xl font-bold text-green-400">
                            +{formatNumber(totalProtective, 1)} ans
                        </p>
                        <p className="text-xs text-gray-400 mt-2">
                            Réserve cognitive
                        </p>
                    </div>
                </div>

                {/* Recommendations */}
                <div className="mt-6 p-4 bg-blue-900/20 border border-blue-909 rounded-lg">
                    <div className="flex items-start gap-3">
                        <svg className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div>
                            <p className="text-sm font-semibold text-blue-400 mb-2">
                                Recommandations prioritaires
                            </p>
                            <ul className="text-sm text-gray-300 space-y-1">
                                <li>• Améliorer la qualité du sommeil (impact potentiel : +2.1 ans)</li>
                                <li>• Augmenter l'engagement social (impact potentiel : +1.5 ans)</li>
                                <li>• Maintenir une activité physique régulière</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}