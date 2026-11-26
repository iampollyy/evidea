import type { CaseSubmissionStage } from '@/shared/types/predictions.types';

export const CASE_SUBMISSION_STEPS = [
  { id: 'submitting', activeLabel: 'Saving clinical case', doneLabel: 'Clinical case saved' },
  { id: 'pending', activeLabel: 'Queuing prediction run', doneLabel: 'Prediction run queued' },
  {
    id: 'processing',
    activeLabel: 'Ranking rare-disease hypotheses',
    doneLabel: 'Hypotheses ranked',
  },
] as const satisfies readonly {
  id: CaseSubmissionStage;
  activeLabel: string;
  doneLabel: string;
}[];

export const CASE_SUBMISSION_PROGRESS: Record<CaseSubmissionStage, number> = {
  submitting: 30,
  pending: 55,
  processing: 80,
};

export const CASE_SUBMISSION_COPY: Record<
  CaseSubmissionStage,
  { eyebrow: string; title: string; description: (patientName: string) => string }
> = {
  submitting: {
    eyebrow: 'Preparing diagnostic workspace',
    title: 'Submitting Clinical Data',
    description: (patientName) => `Securely preparing ${patientName}’s clinical case for analysis.`,
  },
  pending: {
    eyebrow: 'Diagnostic analysis',
    title: 'Awaiting Prediction',
    description: (patientName) => `${patientName}’s case is queued for the prediction model.`,
  },
  processing: {
    eyebrow: 'Diagnostic analysis',
    title: 'Awaiting Prediction',
    description: (patientName) =>
      `Generating ranked rare-disease hypotheses for ${patientName}’s case.`,
  },
};

export const CASE_SUBMISSION_DISCLAIMER =
  'EVIDEA supports clinical reasoning; it does not replace a clinician’s diagnosis.';
