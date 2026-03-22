import { useState } from 'react';
import { PredictionForm } from './components/PredictionForm';
import { ResultsDisplay } from './components/ResultsDisplay';
import { ExtendedPredictionOutput } from './types';  // ← Changé ici
import './App.css';

function App() {
    const [results, setResults] = useState<ExtendedPredictionOutput | null>(null);  // ← Changé ici
    const [showResults, setShowResults] = useState(false);

    const handlePredictionComplete = (prediction: ExtendedPredictionOutput) => {  // ← Changé ici
        setResults(prediction);
        setShowResults(true);
    };
    
    // ... reste du code ...

    const handleBackToForm = () => {
        setShowResults(false);
    };

    return (
        <div className="min-h-screen bg-black text-white">
            {/* Header */}
            <header className="border-b border-gray-800">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center">
                            <svg
                                className="w-7 h-7 text-white"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                                />
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-xl font-bold">Évaluation Neurocognitive</h1>
                            <p className="text-sm text-gray-400">Interface de Triage Clinique</p>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="container mx-auto px-4 py-8">
                {!showResults ? (
                    <PredictionForm onPredictionComplete={handlePredictionComplete} />
                ) : (
                    <ResultsDisplay
                        results={results!}
                        onBack={handleBackToForm}
                    />
                )}
            </main>

            {/* Footer */}
            <footer className="border-t border-gray-800 mt-16">
                <div className="container mx-auto px-4 py-6 text-center text-sm text-gray-400">
                    <p>
                        Cette interface utilise l'IA explicable (XAI) pour visualiser les facteurs de risque neurocognitif
                        et guider le triage clinique.
                    </p>
                    <p className="mt-2 text-xs">
                        Les calculs sont basés sur des modèles prédictifs validés.
                        Consultez toujours un spécialiste pour un diagnostic complet.
                    </p>
                </div>
            </footer>
        </div>
    );
}

export default App;