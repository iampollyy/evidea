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
