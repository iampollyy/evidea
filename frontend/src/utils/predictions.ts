import type { DiseaseHypothesis, HypothesisTone } from '@/shared/types/predictions.types';

export const toPercent = (score: number) => Math.round(Math.min(1, Math.max(0, score)) * 100);

export const formatScore = (score: number) => `${toPercent(score)}%`;

export const formatContribution = (value: number) =>
  `${value > 0 ? '+' : value < 0 ? '−' : ''}${Math.abs(value).toFixed(2)}`;

export const getHypothesisTone = (rank: number): HypothesisTone => {
  if (rank === 1) return 'primary';
  if (rank === 2) return 'secondary';
  return 'muted';
};

export const getTopHypothesis = (hypotheses: DiseaseHypothesis[]) =>
  hypotheses.reduce<DiseaseHypothesis | null>(
    (top, hypothesis) => (top === null || hypothesis.rank < top.rank ? hypothesis : top),
    null,
  );
