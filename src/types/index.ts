/**
 * Types TypeScript pour CogniScreen
 * Version COMPLÈTE avec tous les modules + Courbes de Centiles
 */

// ==================== FORM INPUTS ====================

export interface PredictionInput {
  identifier: string;
  age: number;
  sex: number;
  education: number;
  language: number;
  fluency_score: number;
  model_type?: string;
  // Optional fields for model_2 and model_3
  handedness?: number;
  nb_language?: number;
  hearing?: number;
  moca?: number;
  ravlt_imm?: number;
  ravlt_delay?: number;
  logic_imm?: number;
  logic_delay?: number;
  
  // Risk factors (model_3 only)
  hist_demence_fam?: number;
  hist_demence_parent?: number;
  living_alone?: number;
  income?: number;
  retired?: number;
  stroke?: number;
  tbi?: number;
  hta?: number;
  diab_type2?: number;
  obesity?: number;
  depression?: number;
  anxiety?: number;
  smoking?: number;
  alcohol?: number;
  poly_pharm5?: number;
  physical_activity?: number;
  social_life?: number;
  cognitive_activities?: number;
  nutrition_score?: number;
  sleep_deprivation?: number;
}

export interface FormState extends PredictionInput {
  model_type: string;
}

// ==================== PREDICTION OUTPUTS ====================

export interface PredictionOutput {
  identifier: string;
  model_type: string;
  neurocog_age_flu_weight: number;
  delta_neurocogage_flu_weight: number;
  risk_dementia: number;
  risk_handicap: number;
}

// ==================== MODULE 1 : NUAGE DE POINTS ====================

/**
 * Données de référence pour le nuage de points
 */
export interface ReferenceSubject {
  age: number;
  neurocog_age_flu_weight: number;
  delta_neurocogage_flu_weight: number;
  sex: number;
  education_group: number;
  dementia_dx_code: string;
}

// ==================== MODULE 2 : TRAJECTOIRE TEMPORELLE ====================

/**
 * Point de trajectoire temporelle
 */
export interface TrajectoryPoint {
  year: number;
  age: number;
  delta_nca: number;
  type: 'historical' | 'current' | 'projected';
  ci_lower?: number;
  ci_upper?: number;
}

/**
 * Point normatif avec percentiles
 */
export interface NormativePoint {
  year: number;
  age: number;
  p25: number;
  p75: number;
  median: number;
}

/**
 * Point d'une trajectoire d'exemple (patient réel)
 */
export interface TrajectoryExamplePoint {
  year: number;
  delta_nca: number;
  age: number;
}

/**
 * Trajectoire complète d'un patient d'exemple
 */
export interface TrajectoryExample {
  patient_id: string;
  diagnosis: string;
  points: TrajectoryExamplePoint[];
}

/**
 * Données complètes de la trajectoire temporelle
 */
export interface Trajectory {
  historical: TrajectoryPoint[];
  current: TrajectoryPoint;
  projected: TrajectoryPoint[];
  normative: NormativePoint[];
  annual_decline: number;
  decline_ci: number;
  based_on_real_data: boolean;
  example_trajectories?: TrajectoryExample[];
  horizon_years?: number;
}

// ==================== MODULE 3 : COURBES DE PERCENTILES ====================

/**
 * Point de percentile pour un âge donné
 */
export interface PercentilePoint {
  age: number;
  p3: number;
  p10: number;
  p25: number;
  p50: number;
  p75: number;
  p90: number;
  p97: number;
}

/**
 * Point de la trajectoire du patient sur la courbe de percentiles
 */
export interface PatientTrajectoryPoint {
  age: number;
  delta_nca: number;
  type: "historical" | "current" | "projected";
  ci_lower?: number;
  ci_upper?: number;
}

/**
 * Données complètes des courbes de percentiles
 */
export interface PercentileCurves {
  male: PercentilePoint[];
  female: PercentilePoint[];
  patient_trajectory: PatientTrajectoryPoint[];
  patient_sex: number;
  age_range: [number, number];
  horizon_years?: number;
}
export interface DiagnosticStats {
  min: number;
  max: number;
  mean: number;
  n: number;
}
export interface GlobalStats {
  CON: DiagnosticStats;
  MCI: DiagnosticStats;
  AD: DiagnosticStats;
}
// ==================== MODULE 3B : ZONES DIAGNOSTIQUES ====================
export interface ZoneLimits {
  normal_mci: number;   // Limite entre zone Normale et MCI
  mci_ad: number;       // Limite entre zone MCI et Pathologique
}
export interface ZoneBoundaryPoint {
  age: number;

  // bornes de remplissage (aires empilées)
  green_bottom: number; // bas
  green_blue: number;   // frontière vert -> bleu (90e percentile)
  blue_red: number;     // frontière bleu -> rouge (97e percentile)
  red_top: number;      // haut

  // optionnel si backend les renvoie
  mu?: number;
  sigma?: number;
  n?: number;
  limits?: ZoneLimits; 
  stats?: GlobalStats;  
}

export interface ZoneBoundaries {
  male: ZoneBoundaryPoint[];
  female: ZoneBoundaryPoint[];
  patient_sex: number;
 limits?: ZoneLimits;        // ✅ AJOUTÉ
  stats?: GlobalStats; 
  // optionnel
  thresholds?: {
    green_blue: number; // ex: 90
    blue_red: number;   // ex: 97
  };
}

// ==================== MODULE CENTILES (NOUVEAU - Style CentileBrain) ====================

/**
 * Point de courbe de centile (7 percentiles - style IMC)
 */
export interface CentileCurvePoint {
  age: number;
  p3?: number;    // 3e percentile
  p10?: number;   // 10e percentile
  p25?: number;   // 25e percentile
  p50?: number;   // 50e percentile (médiane)
  p75?: number;   // 75e percentile
  p90?: number;   // 90e percentile
  p97?: number;   // 97e percentile
}

/**
 * Point de données brutes pour affichage en arrière-plan
 */
export interface RawDataPoint {
  age: number;
  value: number;
}

/**
 * Position du patient sur les courbes de centiles
 */
export interface PatientCentilePoint {
  age: number;
  delta_nca: number;
  centile?: number;           // Percentile estimé (0-100)
  z_score?: number;           // Z-score équivalent
  interpretation?: string;     // Interprétation textuelle
  
  zone?: string;  
}

/**
 * Données complètes des courbes de centiles
 */
export interface CentileCurvesData {
  male: CentileCurvePoint[];
  female: CentileCurvePoint[];
  raw_data?: RawDataPoint[];         // Échantillon de points bruts
  patient_point?: PatientCentilePoint;
  patient_sex: number;
  age_range: [number, number];
  axis_domain?: [number, number];
}

// ==================== MODULE 4 : TRAJECTOIRES PAR DIAGNOSTIC ====================

/**
 * Point d'une trajectoire de diagnostic
 */
export interface DiagnosisTrajectoryPoint {
  age: number;
  delta_nca: number;
  year: number;
}
export interface PatientPoint {
  age: number;
  delta_nca: number;
  centile: number;
  z_score?: number;
  interpretation?: string;
  zone?: string;              // ✅ AJOUTÉ
  lms_parameters?: {
    L: number;
    M: number;
    S: number;
  };
}
/**
 * Trajectoire d'un patient pour un diagnostic
 */
export interface DiagnosisTrajectory {
  patient_id: string;
  points: DiagnosisTrajectoryPoint[];
}

/**
 * Ensemble des trajectoires par diagnostic
 */
export interface DiagnosisTrajectories {
  CON?: DiagnosisTrajectory[];
  SCD?: DiagnosisTrajectory[];
  MCI?: DiagnosisTrajectory[];
  AD?: DiagnosisTrajectory[];
  OTHER_DEM?: DiagnosisTrajectory[];
}

// ==================== ÉCARTS-TYPES / Z-SCORE (optionnel) ====================

/**
 * Bandes de zones basées sur écarts-types
 */
export interface StdZoneBand {
  age: number;
  z_green_max: number;  // limite verte (ex: z=1)
  z_blue_max: number;   // limite bleue (ex: z=2)
  mu: number;           // moyenne
  sigma: number;        // écart-type
  n: number;            // nombre d'observations
}

export interface StdZones {
  male: StdZoneBand[];
  female: StdZoneBand[];
  patient_sex: number;
  thresholds: {
    green_blue: number;  // ex: 1 (z-score)
    blue_red: number;    // ex: 2 (z-score)
  };
  y_domain?: [number, number];
}
// ==================== MODULE NCA : PRÉDICTION AVEC GESTION NaN ====================

/**
 * Détail des features utilisées pour la prédiction NCA
 */
export interface NCAFeaturesDetail {
  obligatoires: boolean;   // Tous les champs obligatoires remplis ?
  cognitifs: number;       // Nombre de tests cognitifs optionnels (0-6)
  risques: number;         // Nombre de facteurs de risque renseignés (0-21)
}

/**
 * Résultat de prédiction de l'Âge Neurocognitif (NCA)
 * avec indicateurs de fiabilité selon la complétude
 */
export interface NCAPrediction {
  nca_predicted: number;              // Âge neurocognitif prédit (années)
  delta_nca: number;                  // Différence NCA - âge chronologique
  age_chronologique: number;          // Âge réel du patient
  interpretation: string;             // Interprétation textuelle
  features_used: number;              // Nombre de features utilisées (0-34)
  features_total: number;             // Nombre total de features (34)
  completeness: number;               // Pourcentage de complétude (0-100)
  reliability: string;                // Niveau : 'Élevée' | 'Bonne' | 'Acceptable' | 'Limitée'
  reliability_stars: string;          // Représentation visuelle (ex: '⭐⭐⭐⭐')
  features_detail: NCAFeaturesDetail; // Détail par catégorie
}
// ==================== PREDICTION OUTPUT ÉTENDU ====================

/**
 * Résultat de prédiction étendu avec tous les modules
 */
export interface ExtendedPredictionOutput extends PredictionOutput {
  age: number;
  
  // Module 1 : Nuage de points
  reference_cohort?: ReferenceSubject[];
  
  // Module 2 : Trajectoire temporelle
  trajectory?: Trajectory;
  
  // Module 3 : Courbes de percentiles (anciennes)
  percentile_curves?: PercentileCurves;
  
  // Module 3B : Zones diagnostiques
  zone_boundaries?: ZoneBoundaries;
  
  // MODULE CENTILES (NOUVEAU)
  centile_curves?: CentileCurvesData;
  nca_prediction?: NCAPrediction;
  // Module 4 : Trajectoires par diagnostic
  diagnosis_trajectories?: DiagnosisTrajectories;
  
  // Écarts-types (optionnel)
  std_zones?: StdZones;

  risk_scores?: RiskScores;
}
 // ==================== MODULE NCA : PRÉDICTION AVEC GESTION NaN ====================
 
export interface NCAFeaturesDetail {
   obligatoires: boolean;
   cognitifs: number;
   risques: number;
 }
 
export interface NCAPrediction {
   nca_predicted: number;
   delta_nca: number;
   age_chronologique: number;
   interpretation: string;
   features_used: number;
   features_total: number;
   completeness: number;
   reliability: string;
   reliability_stars: string;
   features_detail: NCAFeaturesDetail;
 }
// ==================== MODEL INFO ====================

export interface ModelInfo {
  id: string;
  name: string;
  description: string;
  required_fields: string[];
  optional_fields: string[];
}

// ==================== FORM LABELS & OPTIONS ====================

export const SEX_OPTIONS = [
  { value: 0, label: 'Femme' },
  { value: 1, label: 'Homme' },
];

export const LANGUAGE_OPTIONS = [
  { value: 0, label: 'Anglais' },
  { value: 1, label: 'Français' },
];

export const HANDEDNESS_OPTIONS = [
  { value: 0, label: 'Gaucher' },
  { value: 1, label: 'Droitier' },
];

export const HEARING_OPTIONS = [
  { value: 0, label: 'Normal' },
  { value: 1, label: 'Déficience' },
];

export const BINARY_OPTIONS = [
  { value: 0, label: 'Non' },
  { value: 1, label: 'Oui' },
];

export const MODEL_OPTIONS = [
  { value: 'model_1', label: 'Modèle 1 - Basique (Fluence seule)' },
  { value: 'model_2', label: 'Modèle 2 - Complet (Tests neuropsycho)' },
  { value: 'model_3', label: 'Modèle 3 - Avancé (Facteurs de risque)' },
];

export const FIELD_LABELS: Record<string, string> = {
  identifier: 'Identifiant',
  age: 'Âge',
  sex: 'Sexe',
  education: 'Années de scolarité',
  language: 'Langue maternelle',
  fluency_score: 'Score de fluence catégorielle',
  handedness: 'Latéralité manuelle',
  nb_language: 'Nombre de langues parlées',
  hearing: 'Audition',
  moca: 'Score MoCA',
  ravlt_imm: 'RAVLT - Rappel immédiat',
  ravlt_delay: 'RAVLT - Rappel différé',
  logic_imm: 'Mémoire logique - Immédiat',
  logic_delay: 'Mémoire logique - Différé',
  hist_demence_fam: 'Historique familial de démence',
  hist_demence_parent: 'Démence chez un parent',
  living_alone: 'Vit seul',
  income: 'Revenu faible',
  retired: 'Retraité',
  stroke: 'Antécédent d\'AVC',
  tbi: 'Traumatisme crânien',
  hta: 'Hypertension artérielle',
  diab_type2: 'Diabète type 2',
  obesity: 'Obésité',
  depression: 'Dépression',
  anxiety: 'Anxiété',
  smoking: 'Tabagisme',
  alcohol: 'Consommation d\'alcool excessive',
  poly_pharm5: 'Polypharmacie (≥5 médicaments)',
  physical_activity: 'Activité physique régulière',
  social_life: 'Vie sociale active',
  cognitive_activities: 'Activités cognitives stimulantes',
  nutrition_score: 'Score nutritionnel',
  sleep_deprivation: 'Privation de sommeil',
};
export interface ModelsInfoResponse {
    models: string[];
    version?: string;
}

export interface ApiError {
    error: string;
    details?: string;
    hint?: string;
}

export interface RiskScores {
  risk_dementia: number;
  risk_handicap: number;
}