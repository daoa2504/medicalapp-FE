import { useState } from 'react';
import { apiService } from '../services/api';
import { PredictionInput, PredictionOutput } from '../types';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Slider } from './ui/slider';
import { ExtendedPredictionOutput } from '../types';
interface PredictionFormProps {
  onPredictionComplete: (result: ExtendedPredictionOutput) => void;  // ← Changé
}

export function PredictionForm({ onPredictionComplete }: PredictionFormProps) {
    const [currentStep, setCurrentStep] = useState<'basic' | 'neuropsych' | 'lifestyle'>('basic');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form data
    const [formData, setFormData] = useState<Partial<PredictionInput>>({
        identifier: '',
        age: 65,
        sex: 0,
        education: 12,
        language: 1,
        fluency_score: 18,
        model_type: 'model_3',
        // Optional fields with defaults
        handedness: 0,
        nb_language: 2,
        hearing: 0,
        moca: 26,
        ravlt_imm: 45,
        ravlt_delay: 10,
        logic_imm: 15,
        logic_delay: 12,
        // Risk factors
        hist_demence_fam: 0,
        hist_demence_parent: 0,
        living_alone: 0,
        income: 1,
        retired: 1,
        stroke: 0,
        tbi: 0,
        hta: 0,
        diab_type2: 0,
        obesity: 0,
        depression: 0,
        anxiety: 0,
        smoking: 0,
        alcohol: 0,
        poly_pharm5: 0,
        physical_activity: 1,
        social_life: 1,
        cognitive_activities: 1,
        nutrition_score: 1,
        sleep_deprivation: 0,
    });

    const updateField = (field: keyof PredictionInput, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        try {
            const result = await apiService.predict(formData as PredictionInput);
            onPredictionComplete(result as ExtendedPredictionOutput);  // ← Correction ici
        } catch (err: any) {
            setError(err.error || 'Une erreur est survenue');
            console.error('Prediction error:', err);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto">
            <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                    <CardTitle className="text-2xl">Évaluation Neurocognitive</CardTitle>
                    <CardDescription className="text-gray-400">
                        Complétez les informations pour obtenir une estimation du vieillissement neurocognitif
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit}>
                        <Tabs value={currentStep} onValueChange={(v) => setCurrentStep(v as any)}>
                            <TabsList className="grid w-full grid-cols-3 bg-gray-800">
                                <TabsTrigger value="basic">Informations de base</TabsTrigger>
                                <TabsTrigger value="neuropsych">Tests neuropsychologiques</TabsTrigger>
                                <TabsTrigger value="lifestyle">Style de vie & Santé</TabsTrigger>
                            </TabsList>

                            {/* Step 1: Basic Information */}
                            <TabsContent value="basic" className="space-y-6 mt-6">
                                <div className="grid grid-cols-2 gap-6">
                                    {/* Identifier */}
                                    <div className="space-y-2">
                                        <Label htmlFor="identifier">Identifiant Patient</Label>
                                        <Input
                                            id="identifier"
                                            value={formData.identifier}
                                            onChange={(e) => updateField('identifier', e.target.value)}
                                            className="bg-gray-800 border-gray-700"
                                            required
                                        />
                                    </div>

                                    {/* Age */}
                                    <div className="space-y-2">
                                        <Label htmlFor="age">Âge: {formData.age} ans</Label>
                                        <Slider
                                            id="age"
                                            min={18}
                                            max={100}
                                            step={1}
                                            value={[formData.age || 65]}
                                            onValueChange={(v) => updateField('age', v[0])}
                                            className="pt-2"
                                        />
                                    </div>

                                    {/* Sex */}
                                    <div className="space-y-2">
                                        <Label htmlFor="sex">Sexe</Label>
                                        <Select
                                            value={String(formData.sex)}
                                            onValueChange={(v) => updateField('sex', Number(v))}
                                        >
                                            <SelectTrigger className="bg-gray-800 border-gray-700">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="bg-gray-800 border-gray-700">
                                                <SelectItem value="0">Femme</SelectItem>
                                                <SelectItem value="1">Homme</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Education */}
                                    <div className="space-y-2">
                                        <Label htmlFor="education">Scolarité: {formData.education} ans</Label>
                                        <Slider
                                            id="education"
                                            min={0}
                                            max={25}
                                            step={1}
                                            value={[formData.education || 12]}
                                            onValueChange={(v) => updateField('education', v[0])}
                                            className="pt-2"
                                        />
                                    </div>

                                    {/* Language */}
                                    <div className="space-y-2">
                                        <Label htmlFor="language">Langue maternelle</Label>
                                        <Select
                                            value={String(formData.language)}
                                            onValueChange={(v) => updateField('language', Number(v))}
                                        >
                                            <SelectTrigger className="bg-gray-800 border-gray-700">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="bg-gray-800 border-gray-700">
                                                <SelectItem value="0">Anglais</SelectItem>
                                                <SelectItem value="1">Français</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Fluency Score */}
                                    <div className="space-y-2">
                                        <Label htmlFor="fluency">Score fluence catégorielle: {formData.fluency_score}</Label>
                                        <Slider
                                            id="fluency"
                                            min={0}
                                            max={40}
                                            step={0.5}
                                            value={[formData.fluency_score || 18]}
                                            onValueChange={(v) => updateField('fluency_score', v[0])}
                                            className="pt-2"
                                        />
                                    </div>

                                    {/* Number of languages */}
                                    <div className="space-y-2">
                                        <Label htmlFor="nb_language">Nombre de langues: {formData.nb_language}</Label>
                                        <Slider
                                            id="nb_language"
                                            min={1}
                                            max={5}
                                            step={1}
                                            value={[formData.nb_language || 2]}
                                            onValueChange={(v) => updateField('nb_language', v[0])}
                                            className="pt-2"
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-end">
                                    <Button
                                        type="button"
                                        onClick={() => setCurrentStep('neuropsych')}
                                        className="bg-blue-600 hover:bg-blue-700"
                                    >
                                        Suivant →
                                    </Button>
                                </div>
                            </TabsContent>

                            {/* Step 2: Neuropsych Tests */}
                            <TabsContent value="neuropsych" className="space-y-6 mt-6">
                                <div className="grid grid-cols-2 gap-6">
                                    {/* MoCA */}
                                    <div className="space-y-2">
                                        <Label htmlFor="moca">Score MoCA: {formData.moca}/30</Label>
                                        <Slider
                                            id="moca"
                                            min={0}
                                            max={30}
                                            step={1}
                                            value={[formData.moca || 26]}
                                            onValueChange={(v) => updateField('moca', v[0])}
                                            className="pt-2"
                                        />
                                    </div>

                                    {/* Handedness */}
                                    <div className="space-y-2">
                                        <Label htmlFor="handedness">Latéralité manuelle</Label>
                                        <Select
                                            value={String(formData.handedness)}
                                            onValueChange={(v) => updateField('handedness', Number(v))}
                                        >
                                            <SelectTrigger className="bg-gray-800 border-gray-700">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="bg-gray-800 border-gray-700">
                                                <SelectItem value="0">Droitier</SelectItem>
                                                <SelectItem value="1">Gaucher/Ambidextre</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* RAVLT Immediate */}
                                    <div className="space-y-2">
                                        <Label htmlFor="ravlt_imm">RAVLT immédiat: {formData.ravlt_imm}/75</Label>
                                        <Slider
                                            id="ravlt_imm"
                                            min={0}
                                            max={75}
                                            step={1}
                                            value={[formData.ravlt_imm || 45]}
                                            onValueChange={(v) => updateField('ravlt_imm', v[0])}
                                            className="pt-2"
                                        />
                                    </div>

                                    {/* RAVLT Delayed */}
                                    <div className="space-y-2">
                                        <Label htmlFor="ravlt_delay">RAVLT différé: {formData.ravlt_delay}/15</Label>
                                        <Slider
                                            id="ravlt_delay"
                                            min={0}
                                            max={15}
                                            step={1}
                                            value={[formData.ravlt_delay || 10]}
                                            onValueChange={(v) => updateField('ravlt_delay', v[0])}
                                            className="pt-2"
                                        />
                                    </div>

                                    {/* Logical Memory Immediate */}
                                    <div className="space-y-2">
                                        <Label htmlFor="logic_imm">Mémoire logique immédiate: {formData.logic_imm}/25</Label>
                                        <Slider
                                            id="logic_imm"
                                            min={0}
                                            max={25}
                                            step={1}
                                            value={[formData.logic_imm || 15]}
                                            onValueChange={(v) => updateField('logic_imm', v[0])}
                                            className="pt-2"
                                        />
                                    </div>

                                    {/* Logical Memory Delayed */}
                                    <div className="space-y-2">
                                        <Label htmlFor="logic_delay">Mémoire logique différée: {formData.logic_delay}/25</Label>
                                        <Slider
                                            id="logic_delay"
                                            min={0}
                                            max={25}
                                            step={1}
                                            value={[formData.logic_delay || 12]}
                                            onValueChange={(v) => updateField('logic_delay', v[0])}
                                            className="pt-2"
                                        />
                                    </div>

                                    {/* Hearing */}
                                    <div className="space-y-2">
                                        <Label htmlFor="hearing">Problème d'audition</Label>
                                        <Select
                                            value={String(formData.hearing)}
                                            onValueChange={(v) => updateField('hearing', Number(v))}
                                        >
                                            <SelectTrigger className="bg-gray-800 border-gray-700">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="bg-gray-800 border-gray-700">
                                                <SelectItem value="0">Non</SelectItem>
                                                <SelectItem value="1">Oui</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="flex justify-between">
                                    <Button
                                        type="button"
                                        onClick={() => setCurrentStep('basic')}
                                        variant="outline"
                                        className="border-gray-700"
                                    >
                                        ← Précédent
                                    </Button>
                                    <Button
                                        type="button"
                                        onClick={() => setCurrentStep('lifestyle')}
                                        className="bg-blue-600 hover:bg-blue-700"
                                    >
                                        Suivant →
                                    </Button>
                                </div>
                            </TabsContent>

                            {/* Step 3: Lifestyle & Health */}
                            <TabsContent value="lifestyle" className="space-y-6 mt-6">
                                <div className="grid grid-cols-3 gap-6">
                                    {/* Binary toggles for risk factors */}
                                    {[
                                        { key: 'hta', label: 'Hypertension' },
                                        { key: 'diab_type2', label: 'Diabète type 2' },
                                        { key: 'obesity', label: 'Obésité' },
                                        { key: 'depression', label: 'Dépression' },
                                        { key: 'anxiety', label: 'Anxiété' },
                                        { key: 'smoking', label: 'Tabagisme' },
                                        { key: 'alcohol', label: 'Alcool' },
                                        { key: 'stroke', label: 'AVC' },
                                        { key: 'tbi', label: 'Traumatisme crânien' },
                                        { key: 'poly_pharm5', label: 'Polypharmacie (≥5)' },
                                        { key: 'living_alone', label: 'Vit seul(e)' },
                                        { key: 'sleep_deprivation', label: 'Privation sommeil' },
                                        { key: 'hist_demence_fam', label: 'Hist. familial démence' },
                                        { key: 'hist_demence_parent', label: 'Hist. parental démence' },
                                        { key: 'retired', label: 'Retraité(e)' },
                                    ].map(({ key, label }) => (
                                        <div key={key} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                                            <Label htmlFor={key} className="text-sm">{label}</Label>
                                            <button
                                                type="button"
                                                id={key}
                                                role="switch"
                                                aria-checked={formData[key as keyof PredictionInput] === 1}
                                                onClick={() => updateField(key as keyof PredictionInput, formData[key as keyof PredictionInput] === 1 ? 0 : 1)}
                                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                                    formData[key as keyof PredictionInput] === 1 ? 'bg-blue-600' : 'bg-gray-600'
                                                }`}
                                            >
                        <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                formData[key as keyof PredictionInput] === 1 ? 'translate-x-6' : 'translate-x-1'
                            }`}
                        />
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                <div className="grid grid-cols-2 gap-6 mt-6">
                                    {/* Income */}
                                    <div className="space-y-2">
                                        <Label htmlFor="income">Revenu</Label>
                                        <Select
                                            value={String(formData.income)}
                                            onValueChange={(v) => updateField('income', Number(v))}
                                        >
                                            <SelectTrigger className="bg-gray-800 border-gray-700">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="bg-gray-800 border-gray-700">
                                                <SelectItem value="0">Faible</SelectItem>
                                                <SelectItem value="1">Élevé</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Physical Activity */}
                                    <div className="space-y-2">
                                        <Label htmlFor="physical_activity">Activité physique</Label>
                                        <Select
                                            value={String(formData.physical_activity)}
                                            onValueChange={(v) => updateField('physical_activity', Number(v))}
                                        >
                                            <SelectTrigger className="bg-gray-800 border-gray-700">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="bg-gray-800 border-gray-700">
                                                <SelectItem value="0">Sédentaire</SelectItem>
                                                <SelectItem value="1">Active</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Social Life */}
                                    <div className="space-y-2">
                                        <Label htmlFor="social_life">Vie sociale</Label>
                                        <Select
                                            value={String(formData.social_life)}
                                            onValueChange={(v) => updateField('social_life', Number(v))}
                                        >
                                            <SelectTrigger className="bg-gray-800 border-gray-700">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="bg-gray-800 border-gray-700">
                                                <SelectItem value="0">Peu active</SelectItem>
                                                <SelectItem value="1">Active</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Cognitive Activities */}
                                    <div className="space-y-2">
                                        <Label htmlFor="cognitive_activities">Activités cognitives</Label>
                                        <Select
                                            value={String(formData.cognitive_activities)}
                                            onValueChange={(v) => updateField('cognitive_activities', Number(v))}
                                        >
                                            <SelectTrigger className="bg-gray-800 border-gray-700">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="bg-gray-800 border-gray-700">
                                                <SelectItem value="0">Peu fréquentes</SelectItem>
                                                <SelectItem value="1">Fréquentes</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Nutrition Score */}
                                    <div className="space-y-2">
                                        <Label htmlFor="nutrition_score">Score nutritionnel</Label>
                                        <Select
                                            value={String(formData.nutrition_score)}
                                            onValueChange={(v) => updateField('nutrition_score', Number(v))}
                                        >
                                            <SelectTrigger className="bg-gray-800 border-gray-700">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="bg-gray-800 border-gray-700">
                                                <SelectItem value="0">Faible</SelectItem>
                                                <SelectItem value="1">Élevé</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                {error && (
                                    <div className="bg-red-900/20 border border-red-900 rounded-lg p-4 text-red-400">
                                        {error}
                                    </div>
                                )}

                                <div className="flex justify-between pt-4">
                                    <Button
                                        type="button"
                                        onClick={() => setCurrentStep('neuropsych')}
                                        variant="outline"
                                        className="border-gray-700"
                                    >
                                        ← Précédent
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                                    >
                                        {isSubmitting ? 'Calcul en cours...' : 'Générer l\'évaluation'}
                                    </Button>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}