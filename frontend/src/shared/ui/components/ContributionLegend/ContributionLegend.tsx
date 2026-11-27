import { CONTRIBUTION_LEGEND } from '@/constants/predictionResults.constants';
import type { ContributionDirection } from '@/shared/types/predictions.types';
import styles from './ContributionLegend.module.scss';

export interface ContributionLegendProps {
  className?: string;
}

const DIRECTIONS: ContributionDirection[] = ['positive', 'negative'];

export function ContributionLegend({ className }: ContributionLegendProps) {
  const classes = [styles.legend, className].filter(Boolean).join(' ');

  return (
    <ul className={classes} aria-label="Chart legend">
      {DIRECTIONS.map((direction) => (
        <li key={direction} className={styles.item}>
          <span className={`${styles.dot} ${styles[direction]}`} aria-hidden="true" />
          {CONTRIBUTION_LEGEND[direction]}
        </li>
      ))}
    </ul>
  );
}
