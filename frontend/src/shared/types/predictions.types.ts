export type RunStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'unsupported';

export type CaseSubmissionStage = 'submitting' | Extract<RunStatus, 'pending' | 'processing'>;

export type ProgressStepStatus = 'done' | 'active' | 'upcoming';

export interface Disease {
  id: string;
  orphaCode: string;
  name: string;
  icdCode: string | null;
  inheritanceType: string | null;
}

export interface DiseaseHypothesis {
  id: string;
  rank: number;
  score: number;
  disease: Disease;
}

export type HypothesisTone = 'primary' | 'secondary' | 'muted';

export type EvidenceSource = 'clinical' | 'laboratory';

export interface EvidenceFactor {
  label: string;
  contribution: number;
}

export type ExplanationMethod = 'shap' | 'lime';

export type ContributionDirection = 'positive' | 'negative';

export interface FeatureContribution {
  id: string;
  label: string;
  source: EvidenceSource;
  value: number;
}

export type HypothesisExplanation = Record<ExplanationMethod, FeatureContribution[]>;
