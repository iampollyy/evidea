import { CASE_REVIEW_INFO } from '@/constants/caseReview.constants';
import { Icon } from '@/shared/ui/atoms/Icon/Icon';
import styles from './SubmissionSummary.module.scss';

export interface SubmissionSummaryProps {
  hasHistory: boolean;
  labTestsCount: number;
  hasVitalSigns: boolean;
  className?: string;
}

export function SubmissionSummary({
  hasHistory,
  labTestsCount,
  hasVitalSigns,
  className,
}: SubmissionSummaryProps) {
  const classes = [styles.summary, className].filter(Boolean).join(' ');
  const items = [
    {
      label: 'Clinical History',
      value: hasHistory ? 'Included' : 'Missing',
      isIncluded: hasHistory,
    },
    {
      label: 'Laboratory Results',
      value: labTestsCount > 0 ? `${labTestsCount} included` : 'None',
      isIncluded: labTestsCount > 0,
    },
    {
      label: 'Vital Signs',
      value: hasVitalSigns ? 'Included' : 'Not recorded',
      isIncluded: hasVitalSigns,
    },
  ];

  return (
    <aside className={classes} aria-labelledby="submission-summary-title">
      <header className={styles.header}>
        <span className={styles.headerIcon}>
          <Icon name="check" />
        </span>
        <div>
          <h2 id="submission-summary-title" className={styles.title}>
            Data Prepared for Analysis
          </h2>
          <p className={styles.subtitle}>Submission summary</p>
        </div>
      </header>

      <dl className={styles.list}>
        {items.map(({ label, value, isIncluded }) => (
          <div key={label} className={styles.row}>
            <dt className={styles.label}>{label}</dt>
            <dd className={isIncluded ? styles.value : styles.valueMissing}>
              <Icon name={isIncluded ? 'check' : 'remove'} className={styles.valueIcon} />
              {value}
            </dd>
          </div>
        ))}
      </dl>

      <p className={styles.info}>
        <Icon name="info" className={styles.infoIcon} />
        {CASE_REVIEW_INFO}
      </p>

      <div className={styles.secure}>
        <Icon name="check" className={styles.secureIcon} />
        <div>
          <p className={styles.secureTitle}>Secure clinical workflow</p>
          <p className={styles.secureText}>Analysis will only begin after your confirmation.</p>
        </div>
      </div>
    </aside>
  );
}
