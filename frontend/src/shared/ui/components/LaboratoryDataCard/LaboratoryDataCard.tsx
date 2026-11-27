import type { CaseLabTest } from '@/shared/types/caseReview.types';
import { Badge } from '@/shared/ui/atoms/Badge/Badge';
import { LabTestRow } from '@/shared/ui/atoms/LabTestRow/LabTestRow';
import { SectionCard } from '@/shared/ui/components/SectionCard/SectionCard';
import { countAvailableLabTests } from '@/utils/caseReview';
import styles from './LaboratoryDataCard.module.scss';

export interface LaboratoryDataCardProps {
  tests: CaseLabTest[];
}

export function LaboratoryDataCard({ tests }: LaboratoryDataCardProps) {
  const availableCount = countAvailableLabTests(tests);

  return (
    <SectionCard
      title="Laboratory Data"
      subtitle="Automatically retrieved from this clinical case"
      icon="science"
      actions={
        <Badge variant="info" size="sm" pill className={styles.badge}>
          {availableCount} {availableCount === 1 ? 'test' : 'tests'} available
        </Badge>
      }
    >
      {tests.length > 0 ? (
        <ul className={styles.list}>
          {tests.map(({ id, ...test }) => (
            <LabTestRow key={id} {...test} />
          ))}
        </ul>
      ) : (
        <p className={styles.empty}>No laboratory results for this case.</p>
      )}
    </SectionCard>
  );
}
