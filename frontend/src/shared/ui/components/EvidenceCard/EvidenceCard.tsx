import { EVIDENCE_SOURCES } from '@/constants/predictionResults.constants';
import type { EvidenceFactor, EvidenceSource } from '@/shared/types/predictions.types';
import { formatContribution } from '@/utils/predictions';
import styles from './EvidenceCard.module.scss';

export interface EvidenceCardProps {
  source: EvidenceSource;
  factors: EvidenceFactor[];
  className?: string;
}

export function EvidenceCard({ source, factors, className }: EvidenceCardProps) {
  const { title, model } = EVIDENCE_SOURCES[source];
  const classes = [styles.card, styles[source], className].filter(Boolean).join(' ');

  return (
    <article className={classes}>
      <header className={styles.header}>
        <h3 className={styles.title}>{title}</h3>
        <span className={styles.model}>{model}</span>
      </header>

      {factors.length > 0 ? (
        <ul className={styles.factors}>
          {factors.map(({ label, contribution }) => (
            <li key={label} className={styles.factor}>
              <span className={styles.label}>{label}</span>
              <span className={contribution < 0 ? styles.negative : styles.contribution}>
                {formatContribution(contribution)}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className={styles.empty}>No contributing factors</p>
      )}
    </article>
  );
}
