import evidenceConnector from '@/assets/decor/evidence-connector.svg';
import type { DiseaseHypothesis, EvidenceFactor } from '@/shared/types/predictions.types';
import { EvidenceCard } from '@/shared/ui/components/EvidenceCard/EvidenceCard';
import { HypothesesList } from '@/shared/ui/components/HypothesesList/HypothesesList';
import { TopPredictionCard } from '@/shared/ui/components/TopPredictionCard/TopPredictionCard';
import { getTopHypothesis } from '@/utils/predictions';
import styles from './PredictionResults.module.scss';

export interface PredictionResultsProps {
  hypotheses: DiseaseHypothesis[];
  clinicalFactors: EvidenceFactor[];
  labFactors: EvidenceFactor[];
  onExplain?: (hypothesisId: string) => void;
  className?: string;
}

export function PredictionResults({
  hypotheses,
  clinicalFactors,
  labFactors,
  onExplain,
  className,
}: PredictionResultsProps) {
  const classes = [styles.results, className].filter(Boolean).join(' ');
  const topHypothesis = getTopHypothesis(hypotheses);

  return (
    <div className={classes}>
      <HypothesesList hypotheses={hypotheses} onExplain={onExplain} />

      <aside className={styles.fusion} aria-labelledby="evidence-fusion-title">
        <header className={styles.header}>
          <h2 id="evidence-fusion-title" className={styles.title}>
            Multimodal Evidence Fusion
          </h2>
          <p className={styles.subtitle}>How the prediction was generated</p>
        </header>

        <div className={styles.body}>
          <EvidenceCard source="clinical" factors={clinicalFactors} />
          <img src={evidenceConnector} alt="" className={styles.connector} />
          <EvidenceCard source="laboratory" factors={labFactors} />

          {topHypothesis && (
            <>
              <img src={evidenceConnector} alt="" className={styles.connector} />
              <TopPredictionCard hypothesis={topHypothesis} />
              <button
                type="button"
                className={styles.fullExplanation}
                disabled={!onExplain}
                onClick={() => onExplain?.(topHypothesis.id)}
              >
                View full explanation →
              </button>
            </>
          )}
        </div>
      </aside>
    </div>
  );
}
