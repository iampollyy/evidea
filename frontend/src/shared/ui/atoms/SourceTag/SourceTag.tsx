import { SOURCE_TAGS } from '@/constants/predictionResults.constants';
import type { EvidenceSource } from '@/shared/types/predictions.types';
import styles from './SourceTag.module.scss';

export interface SourceTagProps {
  source: EvidenceSource;
  className?: string;
}

export function SourceTag({ source, className }: SourceTagProps) {
  const { short, full } = SOURCE_TAGS[source];
  const classes = [styles.tag, styles[source], className].filter(Boolean).join(' ');

  return (
    <abbr className={classes} title={full}>
      {short}
    </abbr>
  );
}
