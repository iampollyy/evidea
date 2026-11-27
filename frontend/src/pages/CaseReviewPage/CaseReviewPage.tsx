import { PAGE_TITLES } from '@/constants/pageTitles.constants';
import { useCaseReview } from '@/shared/hooks/useCaseReview';
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle';
import type { CaseReviewPageProps } from '@/shared/types/caseReview.types';
import { Button } from '@/shared/ui/atoms/Button/Button';
import { CaseReviewSection } from '@/shared/ui/organisms/CaseReviewSection/CaseReviewSection';
import styles from './CaseReviewPage.module.scss';

export function CaseReviewPage({ patientId, caseId, onBack, onSubmit }: CaseReviewPageProps) {
  useDocumentTitle(PAGE_TITLES.caseReview);
  const { patient, anamnesis, labTests, hasVitalSigns, isLoading, error, onRetry } = useCaseReview(
    patientId,
    caseId,
  );

  return (
    <div className={styles.page}>
      {error && (
        <div className={styles.error} role="alert">
          <span>{error}</span>
          <Button variant="secondary" size="sm" onClick={onRetry}>
            Try again
          </Button>
        </div>
      )}

      {isLoading && (
        <p className={styles.status} role="status">
          Loading clinical case…
        </p>
      )}

      {patient && (
        <CaseReviewSection
          patient={patient}
          anamnesis={anamnesis}
          labTests={labTests}
          hasVitalSigns={hasVitalSigns}
          onBack={onBack}
          onSubmit={onSubmit}
        />
      )}
    </div>
  );
}
