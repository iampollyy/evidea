import { LAB_RESULT_COLUMNS } from '@/constants/labResults.constants';
import type { LabResult } from '@/shared/types/labResults.types';
import { LabResultRow } from '@/shared/ui/atoms/LabResultRow/LabResultRow';
import { SectionCard } from '@/shared/ui/components/SectionCard/SectionCard';
import styles from './LabResultsTable.module.scss';

export interface LabResultsTableProps {
  results: LabResult[];
  expandedResultId?: string;
  className?: string;
}

export function LabResultsTable({ results, expandedResultId, className }: LabResultsTableProps) {
  return (
    <SectionCard
      title="Laboratory Results & Investigations"
      subtitle="Laboratory tests and instrumental examinations"
      icon="science"
      className={className}
    >
      <div className={styles.scrollRegion}>
        <div className={styles.table}>
          <div className={styles.heading}>
            {LAB_RESULT_COLUMNS.map((column) => (
              <span key={column} className={styles.headingCell}>
                {column}
              </span>
            ))}
          </div>
          {results.length > 0 ? (
            <ul className={styles.list}>
              {results.map(({ id, ...result }) => (
                <LabResultRow key={id} {...result} defaultExpanded={id === expandedResultId} />
              ))}
            </ul>
          ) : (
            <p className={styles.empty}>No laboratory results yet.</p>
          )}
        </div>
      </div>
    </SectionCard>
  );
}
