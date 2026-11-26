export type RunStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'unsupported';

export type CaseSubmissionStage = 'submitting' | Extract<RunStatus, 'pending' | 'processing'>;

export type ProgressStepStatus = 'done' | 'active' | 'upcoming';
