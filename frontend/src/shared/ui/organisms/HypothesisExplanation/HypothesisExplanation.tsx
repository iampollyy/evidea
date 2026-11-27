import { useState } from 'react';

import type {
  DiseaseHypothesis,
  ExplanationMethod,
  HypothesisExplanation as HypothesisExplanationData,
} from '@/shared/types/predictions.types';
import { Button } from '@/shared/ui/atoms/Button/Button';
import { Icon } from '@/shared/ui/atoms/Icon/Icon';
import { DisclaimerBanner } from '@/shared/ui/components/DisclaimerBanner/DisclaimerBanner';
import { FeatureContributionsCard } from '@/shared/ui/components/FeatureContributionsCard/FeatureContributionsCard';
import { HypothesisSummaryCard } from '@/shared/ui/components/HypothesisSummaryCard/HypothesisSummaryCard';
import { formatScore } from '@/utils/predictions';
import styles from './HypothesisExplanation.module.scss';

export interface HypothesisExplanationProps {
  hypothesis: DiseaseHypothesis;
  explanation: HypothesisExplanationData;
  onBack: () => void;
  className?: string;
}

export function HypothesisExplanation({
  hypothesis,
  explanation,
  onBack,
  className,
}: HypothesisExplanationProps) {
  const [method, setMethod] = useState<ExplanationMethod>('shap');
  const classes = [styles.section, className].filter(Boolean).join(' ');

  return (
    <section className={classes} aria-labelledby="hypothesis-explanation-title">
      <header className={styles.header}>
        <Button
          variant="ghost"
          size="sm"
          className={styles.back}
          icon={<Icon name="arrow_back" />}
          onClick={onBack}
        >
          Back to results
        </Button>
        <span className={styles.divider} aria-hidden="true" />
        <div className={styles.heading}>
          <h2 id="hypothesis-explanation-title" className={styles.title}>
            Why did the model suggest this?
          </h2>
          <p className={styles.subtitle}>
            {hypothesis.disease.name} · Model score: {formatScore(hypothesis.score)}
          </p>
        </div>
      </header>

      <DisclaimerBanner />

      <div className={styles.layout}>
        <FeatureContributionsCard
          method={method}
          contributions={explanation[method]}
          onMethodChange={setMethod}
        />
        <HypothesisSummaryCard hypothesis={hypothesis} className={styles.summary} />
      </div>
    </section>
  );
}
