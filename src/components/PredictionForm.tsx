import { useState } from 'react';
import { apiService } from '../services/api';
import { PredictionInput } from '../types';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Slider } from './ui/slider';
import { ExtendedPredictionOutput } from '../types';

interface PredictionFormProps {
  onPredictionComplete: (result: ExtendedPredictionOutput) => void;
}

export function PredictionForm({ onPredictionComplete }: PredictionFormProps) {
    const [currentStep, setCurrentStep] = useState<'basic' | 'lifestyle'>('basic');
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
        nb_language: 1, // 0 = monolingue, 1 = plurilingue
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
        income: 1, // 0 = difficultés financières, 1 = pas de difficultés
        retired: 0,
        stroke: 0,
        tbi: 0,
        hta: 0,
        diab_type2: 0,
        chol_total: 0, // Nouveau champ
        obesity: 0,
        depression: 0,
        anxiety: 0,
        smoking: 0,
        alcohol: 0,
        poly_pharm5: 0,
        physical_activity: 1, // 0 = sédentaire, 1 = actif
        social_life: 1, // 0 = isolement, 1 = vie sociale active
        cognitive_activities: 1, // 0 = réduite, 1 = active
        nutrition_score: 1, // 0 = dénutrition, 1 = bonne nutrition
        sleep_deprivation: 0,
    });

    const updateField = (field: keyof PredictionInput, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    // Helper pour inverser les valeurs des champs avec logique inversée
    const getInvertedValue = (field: keyof PredictionInput): number => {
        return formData[field] === 1 ? 0 : 1;
    };

    const setInvertedValue = (field: keyof PredictionInput, displayValue: number) => {
        // Si le toggle affiche 1 (OUI pour difficultés), on stocke 0 dans le backend
        updateField(field, displayValue === 1 ? 0 : 1);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        try {
            const result = await apiService.predict(formData as PredictionInput);
            onPredictionComplete(result as ExtendedPredictionOutput);
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
                            <TabsList className="grid w-full grid-cols-2 bg-gray-800">
                                <TabsTrigger value="basic">Informations de base</TabsTrigger>
                                <TabsTrigger value="lifestyle">Santé et style de vie</TabsTrigger>
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

                                    {/* Bilinguisme (nb_language binarisé) */}
                                    <div className="space-y-2">
                                        <Label htmlFor="nb_language">Langues parlées</Label>
                                        <Select
                                            value={String(formData.nb_language)}
                                            onValueChange={(v) => updateField('nb_language', Number(v))}
                                        >
                                            <SelectTrigger className="bg-gray-800 border-gray-700">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="bg-gray-800 border-gray-700">
                                                <SelectItem value="0">Monolingue</SelectItem>
                                                <SelectItem value="1">Plurilingue</SelectItem>
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

                                <div className="flex justify-end">
                                    <Button
                                        type="button"
                                        onClick={() => setCurrentStep('lifestyle')}
                                        className="bg-blue-600 hover:bg-blue-700"
                                    >
                                        Suivant →
                                    </Button>
                                </div>
                            </TabsContent>

                            {/* Step 2: Lifestyle & Health */}
                            <TabsContent value="lifestyle" className="space-y-8 mt-6">
                                {/* Section 1: Profil clinique et médical */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold text-gray-200 border-b border-gray-700 pb-2">
                                        Profil clinique et médical
                                    </h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        {[
                                            { key: 'hist_demence_fam', label: 'Hist. familial démence' },
                                            { key: 'hist_demence_parent', label: 'Hist. parental démence' },
                                            { key: 'hta', label: 'Hypertension' },
                                            { key: 'diab_type2', label: 'Diabète type 2' },
                                            { key: 'cholesterol', label: 'Cholestérol' },
                                            { key: 'obesity', label: 'Obésité' },
                                            { key: 'stroke', label: 'AVC' },
                                            { key: 'tbi', label: 'Traumatisme crânien' },
                                            { key: 'depression', label: 'Dépression' },
                                            { key: 'anxiety', label: 'Anxiété' },
                                            { key: 'poly_pharm5', label: 'Polypharmacie (≥5 médicaments)' },
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
                                </div>

                                {/* Section 2: Contexte psychosocial et habitudes de vie */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold text-gray-200 border-b border-gray-700 pb-2">
                                        Contexte psychosocial et habitudes de vie
                                    </h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        {/* Retired - logique normale */}
                                        <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                                            <Label htmlFor="retired" className="text-sm">Retraité(e)</Label>
                                            <button
                                                type="button"
                                                id="retired"
                                                role="switch"
                                                aria-checked={formData.retired === 1}
                                                onClick={() => updateField('retired', formData.retired === 1 ? 0 : 1)}
                                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                                    formData.retired === 1 ? 'bg-blue-600' : 'bg-gray-600'
                                                }`}
                                            >
                                                <span
                                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                                        formData.retired === 1 ? 'translate-x-6' : 'translate-x-1'
                                                    }`}
                                                />
                                            </button>
                                        </div>

                                        {/* Living alone - logique normale */}
                                        <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                                            <Label htmlFor="living_alone" className="text-sm">Vit seul(e)</Label>
                                            <button
                                                type="button"
                                                id="living_alone"
                                                role="switch"
                                                aria-checked={formData.living_alone === 1}
                                                onClick={() => updateField('living_alone', formData.living_alone === 1 ? 0 : 1)}
                                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                                    formData.living_alone === 1 ? 'bg-blue-600' : 'bg-gray-600'
                                                }`}
                                            >
                                                <span
                                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                                        formData.living_alone === 1 ? 'translate-x-6' : 'translate-x-1'
                                                    }`}
                                                />
                                            </button>
                                        </div>

                                        {/* Income - LOGIQUE INVERSÉE (Difficultés financières) */}
                                        <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                                            <Label htmlFor="income" className="text-sm">Difficultés financières ou matérielles</Label>
                                            <button
                                                type="button"
                                                id="income"
                                                role="switch"
                                                aria-checked={getInvertedValue('income') === 1}
                                                onClick={() => setInvertedValue('income', getInvertedValue('income') === 1 ? 0 : 1)}
                                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                                    getInvertedValue('income') === 1 ? 'bg-blue-600' : 'bg-gray-600'
                                                }`}
                                            >
                                                <span
                                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                                        getInvertedValue('income') === 1 ? 'translate-x-6' : 'translate-x-1'
                                                    }`}
                                                />
                                            </button>
                                        </div>

                                        {/* Social life - LOGIQUE INVERSÉE (Isolement social) */}
                                        <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                                            <Label htmlFor="social_life" className="text-sm">Isolement social</Label>
                                            <button
                                                type="button"
                                                id="social_life"
                                                role="switch"
                                                aria-checked={getInvertedValue('social_life') === 1}
                                                onClick={() => setInvertedValue('social_life', getInvertedValue('social_life') === 1 ? 0 : 1)}
                                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                                    getInvertedValue('social_life') === 1 ? 'bg-blue-600' : 'bg-gray-600'
                                                }`}
                                            >
                                                <span
                                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                                        getInvertedValue('social_life') === 1 ? 'translate-x-6' : 'translate-x-1'
                                                    }`}
                                                />
                                            </button>
                                        </div>

                                        {/* Smoking - logique normale */}
                                        <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                                            <Label htmlFor="smoking" className="text-sm">Tabagisme</Label>
                                            <button
                                                type="button"
                                                id="smoking"
                                                role="switch"
                                                aria-checked={formData.smoking === 1}
                                                onClick={() => updateField('smoking', formData.smoking === 1 ? 0 : 1)}
                                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                                    formData.smoking === 1 ? 'bg-blue-600' : 'bg-gray-600'
                                                }`}
                                            >
                                                <span
                                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                                        formData.smoking === 1 ? 'translate-x-6' : 'translate-x-1'
                                                    }`}
                                                />
                                            </button>
                                        </div>

                                        {/* Alcohol - logique normale */}
                                        <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                                            <Label htmlFor="alcohol" className="text-sm">Alcool</Label>
                                            <button
                                                type="button"
                                                id="alcohol"
                                                role="switch"
                                                aria-checked={formData.alcohol === 1}
                                                onClick={() => updateField('alcohol', formData.alcohol === 1 ? 0 : 1)}
                                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                                    formData.alcohol === 1 ? 'bg-blue-600' : 'bg-gray-600'
                                                }`}
                                            >
                                                <span
                                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                                        formData.alcohol === 1 ? 'translate-x-6' : 'translate-x-1'
                                                    }`}
                                                />
                                            </button>
                                        </div>

                                        {/* Physical activity - LOGIQUE INVERSÉE (Sédentarité) */}
                                        <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                                            <Label htmlFor="physical_activity" className="text-sm">Sédentarité</Label>
                                            <button
                                                type="button"
                                                id="physical_activity"
                                                role="switch"
                                                aria-checked={getInvertedValue('physical_activity') === 1}
                                                onClick={() => setInvertedValue('physical_activity', getInvertedValue('physical_activity') === 1 ? 0 : 1)}
                                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                                    getInvertedValue('physical_activity') === 1 ? 'bg-blue-600' : 'bg-gray-600'
                                                }`}
                                            >
                                                <span
                                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                                        getInvertedValue('physical_activity') === 1 ? 'translate-x-6' : 'translate-x-1'
                                                    }`}
                                                />
                                            </button>
                                        </div>

                                        {/* Nutrition - LOGIQUE INVERSÉE (Dénutrition) */}
                                        <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                                            <Label htmlFor="nutrition_score" className="text-sm">Dénutrition ou mauvaise alimentation</Label>
                                            <button
                                                type="button"
                                                id="nutrition_score"
                                                role="switch"
                                                aria-checked={getInvertedValue('nutrition_score') === 1}
                                                onClick={() => setInvertedValue('nutrition_score', getInvertedValue('nutrition_score') === 1 ? 0 : 1)}
                                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                                    getInvertedValue('nutrition_score') === 1 ? 'bg-blue-600' : 'bg-gray-600'
                                                }`}
                                            >
                                                <span
                                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                                        getInvertedValue('nutrition_score') === 1 ? 'translate-x-6' : 'translate-x-1'
                                                    }`}
                                                />
                                            </button>
                                        </div>

                                        {/* Sleep deprivation - logique normale */}
                                        <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                                            <Label htmlFor="sleep_deprivation" className="text-sm">Privation de sommeil</Label>
                                            <button
                                                type="button"
                                                id="sleep_deprivation"
                                                role="switch"
                                                aria-checked={formData.sleep_deprivation === 1}
                                                onClick={() => updateField('sleep_deprivation', formData.sleep_deprivation === 1 ? 0 : 1)}
                                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                                    formData.sleep_deprivation === 1 ? 'bg-blue-600' : 'bg-gray-600'
                                                }`}
                                            >
                                                <span
                                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                                        formData.sleep_deprivation === 1 ? 'translate-x-6' : 'translate-x-1'
                                                    }`}
                                                />
                                            </button>
                                        </div>

                                        {/* Cognitive activities - LOGIQUE INVERSÉE (Activité cognitive réduite) */}
                                        <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                                            <Label htmlFor="cognitive_activities" className="text-sm">Activité cognitive réduite</Label>
                                            <button
                                                type="button"
                                                id="cognitive_activities"
                                                role="switch"
                                                aria-checked={getInvertedValue('cognitive_activities') === 1}
                                                onClick={() => setInvertedValue('cognitive_activities', getInvertedValue('cognitive_activities') === 1 ? 0 : 1)}
                                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                                    getInvertedValue('cognitive_activities') === 1 ? 'bg-blue-600' : 'bg-gray-600'
                                                }`}
                                            >
                                                <span
                                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                                        getInvertedValue('cognitive_activities') === 1 ? 'translate-x-6' : 'translate-x-1'
                                                    }`}
                                                />
                                            </button>
                                        </div>
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
                                        onClick={() => setCurrentStep('basic')}
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