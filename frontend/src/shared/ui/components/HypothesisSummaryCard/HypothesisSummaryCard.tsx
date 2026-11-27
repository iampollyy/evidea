import type { DiseaseHypothesis } from '@/shared/types/predictions.types';
import { ProgressBar } from '@/shared/ui/atoms/ProgressBar/ProgressBar';
import { formatScore, toPercent } from '@/utils/predictions';
import styles from './HypothesisSummaryCard.module.scss';

export interface HypothesisSummaryCardProps {
  hypothesis: DiseaseHypothesis;
  className?: string;
}

export function HypothesisSummaryCard({ hypothesis, className }: HypothesisSummaryCardProps) {
  const { rank, score, disease } = hypothesis;
  const classes = [styles.card, className].filter(Boolean).join(' ');

  return (
    <article className={classes}>
      <header className={styles.header}>
        <h3 className={styles.eyebrow}>Hypothesis Summary</h3>
        <span className={styles.rank}>Rank #{rank}</span>
      </header>

      <p className={styles.name}>{disease.name}</p>
      {disease.icdCode && <p className={styles.code}>ICD-10: {disease.icdCode}</p>}

      <p className={styles.scoreLabel}>Model score</p>
      <div className={styles.scoreBar}>
        <ProgressBar
          value={toPercent(score)}
          label={`${disease.name} model score`}
          className={styles.bar}
        />
        <span className={styles.percent}>{formatScore(score)}</span>
      </div>
    </article>
  );
}
