import type { EvidenceSource } from '@/shared/types/predictions.types';

export const EVIDENCE_SOURCES: Record<EvidenceSource, { title: string; model: string }> = {
  clinical: { title: 'Clinical Narrative', model: 'Transformer' },
  laboratory: { title: 'Laboratory Biomarkers', model: 'Gradient Boosting' },
};

export const HYPOTHESES_DISCLAIMER =
  'AI-assisted differential diagnosis · Scores indicate model confidence, not clinical probability';
