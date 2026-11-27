import type {
  ContributionDirection,
  EvidenceSource,
  ExplanationMethod,
} from '@/shared/types/predictions.types';

export const EVIDENCE_SOURCES: Record<EvidenceSource, { title: string; model: string }> = {
  clinical: { title: 'Clinical Narrative', model: 'Transformer' },
  laboratory: { title: 'Laboratory Biomarkers', model: 'Gradient Boosting' },
};

export const HYPOTHESES_DISCLAIMER =
  'AI-assisted differential diagnosis · Scores indicate model confidence, not clinical probability';

export const CLINICAL_DECISION_NOTICE = {
  title: 'AI-generated clinical decision support.',
  text: 'These results are hypotheses, not diagnoses. The physician is responsible for all clinical decisions.',
};

export const SOURCE_TAGS: Record<EvidenceSource, { short: string; full: string }> = {
  clinical: { short: 'Clin', full: 'Clinical feature' },
  laboratory: { short: 'Lab', full: 'Laboratory feature' },
};

export const EXPLANATION_METHODS: Record<
  ExplanationMethod,
  { label: string; title: string; description: string }
> = {
  shap: {
    label: 'SHAP',
    title: 'SHAP values',
    description:
      'positive contributions push toward this diagnosis; negative contributions push away',
  },
  lime: {
    label: 'LIME',
    title: 'LIME weights',
    description:
      'local surrogate model fitted around this case; weights show how each feature moved the score',
  },
};

export const CONTRIBUTION_LEGEND: Record<ContributionDirection, string> = {
  positive: 'Supports this diagnosis',
  negative: 'Argues against this diagnosis',
};
