import type {
  ContributionDirection,
  DiseaseHypothesis,
  FeatureContribution,
  HypothesisTone,
} from '@/shared/types/predictions.types';

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

export const getContributionScale = (contributions: FeatureContribution[]) => {
  const maxImpact = Math.max(0, ...contributions.map(({ value }) => Math.abs(value)));
  return Math.max(0.1, Math.ceil(maxImpact * 10) / 10);
};

export const sortByImpact = (contributions: FeatureContribution[]) =>
  [...contributions].sort(
    (a, b) => Number(b.value >= 0) - Number(a.value >= 0) || Math.abs(b.value) - Math.abs(a.value),
  );

export const getContributionDirection = (value: number): ContributionDirection =>
  value < 0 ? 'negative' : 'positive';
