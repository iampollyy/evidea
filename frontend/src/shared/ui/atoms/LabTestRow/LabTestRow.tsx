import { CASE_REVIEW_LAB_STATUSES } from '@/constants/caseReview.constants';
import type { CaseLabTest } from '@/shared/types/caseReview.types';
import { Icon } from '../Icon/Icon';
import styles from './LabTestRow.module.scss';

export type LabTestRowProps = Omit<CaseLabTest, 'id'>;

export function LabTestRow({ name, category, status }: LabTestRowProps) {
  const { label, icon } = CASE_REVIEW_LAB_STATUSES[status];

  return (
    <li className={`${styles.row} ${styles[status]}`}>
      <span className={styles.icon}>
        <Icon name={icon} />
      </span>
      <span className={styles.info}>
        <span className={styles.name}>{name}</span>
        <span className={styles.category}>{category}</span>
      </span>
      <span className={styles.status}>{label}</span>
    </li>
  );
}
