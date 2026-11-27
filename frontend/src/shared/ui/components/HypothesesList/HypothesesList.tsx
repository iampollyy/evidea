import { HYPOTHESES_DISCLAIMER } from '@/constants/predictionResults.constants';
import type { DiseaseHypothesis } from '@/shared/types/predictions.types';
import { HypothesisCard } from '@/shared/ui/components/HypothesisCard/HypothesisCard';
import styles from './HypothesesList.module.scss';

export interface HypothesesListProps {
  hypotheses: DiseaseHypothesis[];
  onExplain?: (hypothesisId: string) => void;
  className?: string;
}

export function HypothesesList({ hypotheses, onExplain, className }: HypothesesListProps) {
  const classes = [styles.list, className].filter(Boolean).join(' ');
  const sorted = [...hypotheses].sort((a, b) => a.rank - b.rank);

  return (
    <section className={classes} aria-labelledby="hypotheses-list-title">
      <header className={styles.header}>
        <h2 id="hypotheses-list-title" className={styles.title}>
          Ranked Diagnostic Hypotheses
        </h2>
        <p className={styles.subtitle}>{HYPOTHESES_DISCLAIMER}</p>
      </header>

      {sorted.length > 0 ? (
        <ol className={styles.items}>
          {sorted.map((hypothesis) => (
            <li key={hypothesis.id} className={styles.item}>
              <HypothesisCard
                hypothesis={hypothesis}
                onExplain={onExplain && (() => onExplain(hypothesis.id))}
              />
            </li>
          ))}
        </ol>
      ) : (
        <p className={styles.empty}>No diagnostic hypotheses were generated for this case.</p>
      )}
    </section>
  );
}
