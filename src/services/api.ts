import axios, { AxiosError } from 'axios';
import {
    PredictionInput,
    PredictionOutput,
    ModelsInfoResponse,
    ApiError,
} from '../types';

// Configuration de l'API
const API_BASE_URL = 'http://localhost:8000';

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 30000, // 30 secondes
});

/**
 * Service API pour les prédictions CogniScreen
 */
class ApiService {
    /**
     * Effectue une prédiction
     * @param data - Données du patient
     * @returns Résultat de la prédiction
     */
    async predict(data: PredictionInput): Promise<PredictionOutput> {
        try {
            const response = await apiClient.post<PredictionOutput>(
                '/api/predict/',
                data
            );
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    /**
     * Récupère les informations sur les modèles disponibles
     * @returns Information sur les modèles
     */
    async getModelsInfo(): Promise<ModelsInfoResponse> {
        try {
            const response = await apiClient.get<ModelsInfoResponse>('/api/models/');
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    /**
     * Vérifie la santé de l'API
     * @returns Statut de l'API
     */
    async healthCheck(): Promise<{ status: string; message: string }> {
        try {
            const response = await apiClient.get('/api/health/');
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    /**
     * Gère les erreurs de l'API
     * @param error - Erreur Axios
     * @returns Erreur formatée
     */
    private handleError(error: unknown): ApiError {
        if (axios.isAxiosError(error)) {
            const axiosError = error as AxiosError<ApiError>;

            // Erreur de réponse du serveur
            if (axiosError.response) {
                return {
                    error: axiosError.response.data.error || 'Erreur serveur',
                    details: axiosError.response.data.details,
                    hint: axiosError.response.data.hint,
                };
            }

            // Erreur réseau
            if (axiosError.request) {
                return {
                    error: 'Erreur réseau',
                    details: 'Impossible de contacter le serveur. Vérifiez votre connexion.',
                };
            }
        }

        // Erreur inconnue
        return {
            error: 'Erreur inconnue',
            details: error instanceof Error ? error.message : 'Une erreur est survenue',
        };
    }
}

// Export d'une instance singleton
export const apiService = new ApiService();

// Export de la classe pour les tests
export default ApiService;