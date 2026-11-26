import { CLINICAL_CASE_STATUSES } from '@/constants/clinicalCases.constants';
import type { ClinicalCaseOption } from '@/shared/types/clinicalCases.types';
import { formatCreatedDate } from '@/utils/date';
import { Badge } from '../Badge/Badge';
import { Icon } from '../Icon/Icon';
import styles from './ClinicalCaseRow.module.scss';

export interface ClinicalCaseRowProps extends Omit<ClinicalCaseOption, 'id'> {
  name: string;
  checked: boolean;
  onSelect: () => void;
}

function formatLabTests(count: number) {
  if (count === 0) return 'No lab tests';
  return `${count} lab ${count === 1 ? 'test' : 'tests'}`;
}

export function ClinicalCaseRow({
  patientCode,
  caseCode,
  updatedAt,
  hasHistory,
  labTestsCount,
  status,
  name,
  checked,
  onSelect,
}: ClinicalCaseRowProps) {
  const { label, variant } = CLINICAL_CASE_STATUSES[status];
  const availability = [
    { label: hasHistory ? 'History' : 'No history', isAvailable: hasHistory },
    { label: formatLabTests(labTestsCount), isAvailable: labTestsCount > 0 },
  ];

  return (
    <li className={[styles.row, checked && styles.checked].filter(Boolean).join(' ')}>
      <label className={styles.main}>
        <span className={`${styles.cell} ${styles.select}`}>
          <input
            type="radio"
            name={name}
            className={styles.input}
            checked={checked}
            onChange={onSelect}
            aria-label={`${caseCode}, patient ${patientCode}`}
          />
          <span className={styles.radio} aria-hidden="true" />
        </span>
        <span className={`${styles.cell} ${styles.code}`}>{patientCode}</span>
        <span className={`${styles.cell} ${styles.code} ${styles.caseCode}`}>{caseCode}</span>
        <span className={`${styles.cell} ${styles.date}`}>{formatCreatedDate(updatedAt)}</span>
        <span className={styles.cell}>
          <span className={styles.availability}>
            {availability.map((item) => (
              <span
                key={item.label}
                className={[styles.availabilityItem, !item.isAvailable && styles.missing]
                  .filter(Boolean)
                  .join(' ')}
              >
                <span className={styles.availabilityIcon}>
                  <Icon name={item.isAvailable ? 'check' : 'remove'} />
                </span>
                {item.label}
              </span>
            ))}
          </span>
        </span>
        <span className={styles.cell}>
          <Badge variant={variant} size="sm" pill className={`${styles.badge} ${styles[status]}`}>
            {label}
          </Badge>
        </span>
      </label>
    </li>
  );
}
