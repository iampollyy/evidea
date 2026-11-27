import { CLINICAL_DECISION_NOTICE } from '@/constants/predictionResults.constants';
import { Icon } from '@/shared/ui/atoms/Icon/Icon';
import styles from './DisclaimerBanner.module.scss';

export interface DisclaimerBannerProps {
  className?: string;
}

export function DisclaimerBanner({ className }: DisclaimerBannerProps) {
  const classes = [styles.banner, className].filter(Boolean).join(' ');

  return (
    <div className={classes} role="note">
      <Icon name="info" className={styles.icon} />
      <p className={styles.text}>
        <strong className={styles.title}>{CLINICAL_DECISION_NOTICE.title}</strong>{' '}
        {CLINICAL_DECISION_NOTICE.text}
      </p>
    </div>
  );
}
