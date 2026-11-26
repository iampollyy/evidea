import { useId, useState } from 'react';

import { LAB_RESULT_NOT_SCHEDULED, LAB_RESULT_STATUSES } from '@/constants/labResults.constants';
import type { LabResult } from '@/shared/types/labResults.types';
import { formatLabDate } from '@/utils/date';
import { Badge } from '../Badge/Badge';
import { Button } from '../Button/Button';
import { Icon } from '../Icon/Icon';
import styles from './LabResultRow.module.scss';

export interface LabResultRowProps extends Omit<LabResult, 'id'> {
  defaultExpanded?: boolean;
}

export function LabResultRow({
  name,
  category,
  date,
  status,
  summary,
  isFlagged = false,
  details,
  defaultExpanded = false,
}: LabResultRowProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const detailsId = useId();
  const { label, variant } = LAB_RESULT_STATUSES[status];
  const summaryClasses = [styles.cell, styles.summary, isFlagged && styles.flagged]
    .filter(Boolean)
    .join(' ');

  return (
    <li className={styles.row}>
      <div className={styles.main}>
        <span className={`${styles.cell} ${styles.name}`}>{name}</span>
        <span className={`${styles.cell} ${styles.category}`}>{category}</span>
        <span className={`${styles.cell} ${styles.date}`}>
          {date ? formatLabDate(date) : LAB_RESULT_NOT_SCHEDULED}
        </span>
        <span className={styles.cell}>
          <Badge variant={variant} size="sm" pill className={`${styles.badge} ${styles[status]}`}>
            {label}
          </Badge>
        </span>
        <span className={summaryClasses}>{summary}</span>
        <span className={`${styles.cell} ${styles.action}`}>
          {details && (
            <Button
              variant="ghost"
              size="sm"
              className={styles.toggle}
              icon={<Icon name={isExpanded ? 'expand_less' : 'expand_more'} />}
              aria-label={`${isExpanded ? 'Hide' : 'View'} details for ${name}`}
              aria-expanded={isExpanded}
              aria-controls={detailsId}
              onClick={() => setIsExpanded((current) => !current)}
            />
          )}
        </span>
      </div>
      {details && isExpanded && (
        <div id={detailsId} className={styles.details}>
          <p className={styles.detailsLabel}>Clinical result details</p>
          <p className={styles.detailsText}>{details}</p>
        </div>
      )}
    </li>
  );
}
