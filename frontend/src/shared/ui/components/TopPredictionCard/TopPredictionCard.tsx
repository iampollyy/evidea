import type { DiseaseHypothesis } from '@/shared/types/predictions.types';
import { formatScore } from '@/utils/predictions';
import styles from './TopPredictionCard.module.scss';

export interface TopPredictionCardProps {
  hypothesis: DiseaseHypothesis;
  className?: string;
}

export function TopPredictionCard({ hypothesis, className }: TopPredictionCardProps) {
  const classes = [styles.card, className].filter(Boolean).join(' ');

  return (
    <article className={classes}>
      <p className={styles.label}>Combined Prediction</p>
      <h3 className={styles.name}>{hypothesis.disease.name}</h3>
      <p className={styles.score}>{formatScore(hypothesis.score)}</p>
      <p className={styles.caption}>Ensemble model score</p>
    </article>
  );
}
