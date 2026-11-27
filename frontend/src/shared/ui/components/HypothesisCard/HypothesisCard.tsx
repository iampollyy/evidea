import type { DiseaseHypothesis } from '@/shared/types/predictions.types';
import { Button } from '@/shared/ui/atoms/Button/Button';
import { ProgressBar } from '@/shared/ui/atoms/ProgressBar/ProgressBar';
import { formatScore, getHypothesisTone, toPercent } from '@/utils/predictions';
import styles from './HypothesisCard.module.scss';

export interface HypothesisCardProps {
  hypothesis: DiseaseHypothesis;
  onExplain?: () => void;
  className?: string;
}

export function HypothesisCard({ hypothesis, onExplain, className }: HypothesisCardProps) {
  const { rank, score, disease } = hypothesis;
  const tone = getHypothesisTone(rank);
  const classes = [styles.card, styles[tone], className].filter(Boolean).join(' ');
  const scoreLabel = formatScore(score);

  return (
    <article className={classes}>
      <div className={styles.header}>
        <div className={styles.identity}>
          <span className={styles.rank}>{rank}</span>
          <div>
            <h3 className={styles.name}>{disease.name}</h3>
            {disease.icdCode && <span className={styles.code}>{disease.icdCode}</span>}
          </div>
        </div>
        <div className={styles.score}>
          <span className={styles.scoreLabel}>Model score</span>
          <span className={styles.scoreValue}>{scoreLabel}</span>
        </div>
      </div>

      <div className={styles.scoreBar}>
        <ProgressBar
          value={toPercent(score)}
          label={`${disease.name} model score`}
          className={styles.bar}
        />
        <span className={styles.percent}>{scoreLabel}</span>
      </div>

      <div className={styles.actions}>
        <Button
          size="sm"
          variant={tone === 'primary' ? 'primary' : 'secondary'}
          className={styles.explain}
          disabled={!onExplain}
          onClick={onExplain}
        >
          View explanation
        </Button>
      </div>
    </article>
  );
}
