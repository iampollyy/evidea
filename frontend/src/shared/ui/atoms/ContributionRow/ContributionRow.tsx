import type { CSSProperties } from 'react';

import type { FeatureContribution } from '@/shared/types/predictions.types';
import { SourceTag } from '@/shared/ui/atoms/SourceTag/SourceTag';
import { formatContribution, getContributionDirection } from '@/utils/predictions';
import styles from './ContributionRow.module.scss';

export interface ContributionRowProps {
  contribution: FeatureContribution;
  scale: number;
  className?: string;
}

export function ContributionRow({ contribution, scale, className }: ContributionRowProps) {
  const { label, source, value } = contribution;
  const direction = getContributionDirection(value);
  const classes = [styles.row, styles[direction], className].filter(Boolean).join(' ');
  const barStyle = {
    '--bar-size': `${Math.min(1, Math.abs(value) / scale) * 50}%`,
  } as CSSProperties;

  return (
    <li className={classes}>
      <span className={styles.feature}>
        <span className={styles.label}>{label}</span>
        <SourceTag source={source} />
      </span>
      <span className={styles.track} aria-hidden="true">
        <span className={styles.bar} style={barStyle} />
      </span>
      <span className={styles.value}>{formatContribution(value)}</span>
    </li>
  );
}
