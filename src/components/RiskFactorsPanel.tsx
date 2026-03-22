import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import { Slider } from './ui/slider';

export function RiskFactorsPanel() {
    const [factors, setFactors] = useState({
        sleep_quality: 4,
        social_isolation: 6,
        physical_activity: 5,
        smoking: 0,
        education: 12,
        languages: 2,
        financial_difficulties: 5,
        hypertension: 1,
        diabetes: 1,
        living_alone: 1,
    });

    const updateFactor = (key: string, value: number) => {
        setFactors(prev => ({ ...prev, [key]: value }));
    };

    return (
        <Card className="bg-gray-900 border-gray-800 sticky top-6">
            <CardHeader>
                <CardTitle className="text-lg">Facteurs de Risque et Protecteurs</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Sleep Quality */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <Label className="text-sm">Qualité du Sommeil</Label>
                        <span className="text-sm font-semibold">{factors.sleep_quality}/10</span>
                    </div>
                    <Slider
                        min={0}
                        max={10}
                        step={1}
                        value={[factors.sleep_quality]}
                        onValueChange={(v) => updateFactor('sleep_quality', v[0])}
                        className="py-2"
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                        <span>Très mauvais</span>
                        <span>Excellent</span>
                    </div>
                </div>

                {/* Social Isolation */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <Label className="text-sm">Isolement Social</Label>
                        <span className="text-sm font-semibold">{factors.social_isolation}/10</span>
                    </div>
                    <Slider
                        min={0}
                        max={10}
                        step={1}
                        value={[factors.social_isolation]}
                        onValueChange={(v) => updateFactor('social_isolation', v[0])}
                        className="py-2"
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                        <span>Très connecté</span>
                        <span>Très isolé</span>
                    </div>
                </div>

                {/* Physical Activity */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <Label className="text-sm">Activité Physique</Label>
                        <span className="text-sm font-semibold">{factors.physical_activity}/10</span>
                    </div>
                    <Slider
                        min={0}
                        max={10}
                        step={1}
                        value={[factors.physical_activity]}
                        onValueChange={(v) => updateFactor('physical_activity', v[0])}
                        className="py-2"
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                        <span>Sédentaire</span>
                        <span>Très actif</span>
                    </div>
                </div>

                {/* Smoking */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <Label className="text-sm">Tabagisme</Label>
                        <span className="text-sm font-semibold">
              {factors.smoking === 0 ? 'Non-fumeur' : 'Fumeur'}
            </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => updateFactor('smoking', 0)}
                            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                                factors.smoking === 0
                                    ? 'bg-green-600 text-white'
                                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                            }`}
                        >
                            Non-fumeur
                        </button>
                        <button
                            onClick={() => updateFactor('smoking', 1)}
                            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                                factors.smoking === 1
                                    ? 'bg-orange-600 text-white'
                                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                            }`}
                        >
                            Fumeur
                        </button>
                    </div>
                </div>

                {/* Education */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <Label className="text-sm">Éducation (années)</Label>
                        <span className="text-sm font-semibold">{factors.education} ans</span>
                    </div>
                    <Slider
                        min={0}
                        max={25}
                        step={1}
                        value={[factors.education]}
                        onValueChange={(v) => updateFactor('education', v[0])}
                        className="py-2"
                    />
                </div>

                {/* Languages */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <Label className="text-sm">Langues Parlées</Label>
                        <span className="text-sm font-semibold">{factors.languages} langues</span>
                    </div>
                    <Slider
                        min={1}
                        max={5}
                        step={1}
                        value={[factors.languages]}
                        onValueChange={(v) => updateFactor('languages', v[0])}
                        className="py-2"
                    />
                </div>

                {/* Financial Difficulties */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <Label className="text-sm">Difficultés Matérielles</Label>
                        <span className="text-sm font-semibold">{factors.financial_difficulties}/10</span>
                    </div>
                    <Slider
                        min={0}
                        max={10}
                        step={1}
                        value={[factors.financial_difficulties]}
                        onValueChange={(v) => updateFactor('financial_difficulties', v[0])}
                        className="py-2"
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                        <span>Aucune</span>
                        <span>Sévères</span>
                    </div>
                </div>

                {/* Toggle switches */}
                <div className="space-y-3 pt-4 border-t border-gray-800">
                    {[
                        { key: 'hypertension', label: 'Hypertension' },
                        { key: 'diabetes', label: 'Diabète' },
                        { key: 'living_alone', label: 'Vit Seul' },
                    ].map(({ key, label }) => (
                        <div key={key} className="flex items-center justify-between">
                            <Label className="text-sm">{label}</Label>
                            <button
                                type="button"
                                role="switch"
                                aria-checked={factors[key as keyof typeof factors] === 1}
                                onClick={() => updateFactor(key, factors[key as keyof typeof factors] === 1 ? 0 : 1)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                    factors[key as keyof typeof factors] === 1 ? 'bg-orange-600' : 'bg-gray-600'
                                }`}
                            >
                <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        factors[key as keyof typeof factors] === 1 ? 'translate-x-6' : 'translate-x-1'
                    }`}
                />
                            </button>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}