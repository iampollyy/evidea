import { EXPLANATION_METHODS } from '@/constants/predictionResults.constants';
import type { ExplanationMethod, FeatureContribution } from '@/shared/types/predictions.types';
import { ContributionRow } from '@/shared/ui/atoms/ContributionRow/ContributionRow';
import { ContributionLegend } from '@/shared/ui/components/ContributionLegend/ContributionLegend';
import { ExplanationMethodSwitch } from '@/shared/ui/components/ExplanationMethodSwitch/ExplanationMethodSwitch';
import { formatContribution, getContributionScale, sortByImpact } from '@/utils/predictions';
import styles from './FeatureContributionsCard.module.scss';

export interface FeatureContributionsCardProps {
  method: ExplanationMethod;
  contributions: FeatureContribution[];
  onMethodChange?: (method: ExplanationMethod) => void;
  className?: string;
}

export function FeatureContributionsCard({
  method,
  contributions,
  onMethodChange,
  className,
}: FeatureContributionsCardProps) {
  const classes = [styles.card, className].filter(Boolean).join(' ');
  const { title, description } = EXPLANATION_METHODS[method];
  const scale = getContributionScale(contributions);
  const sorted = sortByImpact(contributions);

  return (
    <section className={classes} aria-labelledby="feature-contributions-title">
      <header className={styles.header}>
        <div className={styles.heading}>
          <h3 id="feature-contributions-title" className={styles.title}>
            Feature Contributions to Prediction
          </h3>
          <p className={styles.description}>
            {title} — {description}
          </p>
        </div>
        <ExplanationMethodSwitch value={method} onChange={onMethodChange} />
      </header>

      <div className={styles.body}>
        <ContributionLegend />

        {sorted.length > 0 ? (
          <>
            <ul className={styles.rows}>
              {sorted.map((contribution) => (
                <ContributionRow key={contribution.id} contribution={contribution} scale={scale} />
              ))}
            </ul>
            <div className={styles.axis} aria-hidden="true">
              <span className={styles.ticks}>
                <span>{formatContribution(-scale)}</span>
                <span>0</span>
                <span>{formatContribution(scale)}</span>
              </span>
            </div>
          </>
        ) : (
          <p className={styles.empty}>No feature contributions are available for this method.</p>
        )}
      </div>
    </section>
  );
}
