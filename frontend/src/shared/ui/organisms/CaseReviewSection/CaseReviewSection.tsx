import type { CaseLabTest } from '@/shared/types/caseReview.types';
import type { AnamnesisValues } from '@/shared/types/cases.types';
import { Button } from '@/shared/ui/atoms/Button/Button';
import { Icon } from '@/shared/ui/atoms/Icon/Icon';
import { ClinicalHistoryCard } from '@/shared/ui/components/ClinicalHistoryCard/ClinicalHistoryCard';
import { LaboratoryDataCard } from '@/shared/ui/components/LaboratoryDataCard/LaboratoryDataCard';
import {
  PatientBanner,
  type PatientBannerPatient,
} from '@/shared/ui/components/PatientBanner/PatientBanner';
import { SubmissionSummary } from '@/shared/ui/components/SubmissionSummary/SubmissionSummary';
import { countAvailableLabTests, hasAnamnesis } from '@/utils/caseReview';
import styles from './CaseReviewSection.module.scss';

export interface CaseReviewSectionProps {
  patient: PatientBannerPatient;
  anamnesis: AnamnesisValues | null;
  labTests: CaseLabTest[];
  hasVitalSigns: boolean;
  onBack: () => void;
  onSubmit?: () => void;
}

export function CaseReviewSection({
  patient,
  anamnesis,
  labTests,
  hasVitalSigns,
  onBack,
  onSubmit,
}: CaseReviewSectionProps) {
  return (
    <section className={styles.section} aria-labelledby="case-review-title">
      <header className={styles.header}>
        <div>
          <h1 id="case-review-title" className={styles.title}>
            Review Clinical Data
          </h1>
          <p className={styles.subtitle}>
            Review the selected case data before submitting it for diagnostic analysis.
          </p>
        </div>
        <p className={styles.source}>
          <span className={styles.sourceIcon}>
            <Icon name="check" />
          </span>
          Data retrieved from clinical record
        </p>
      </header>

      <PatientBanner patient={patient} />

      <div className={styles.layout}>
        <div className={styles.main}>
          <ClinicalHistoryCard anamnesis={anamnesis} />
          <LaboratoryDataCard tests={labTests} />

          <footer className={styles.footer}>
            <Button
              variant="tertiary"
              className={styles.back}
              icon={<Icon name="arrow_back" />}
              onClick={onBack}
            >
              Back to Case Selection
            </Button>
            <Button className={styles.submit} disabled={!onSubmit} onClick={onSubmit}>
              Submit for Analysis
              <Icon name="arrow_forward" className={styles.submitIcon} />
            </Button>
          </footer>
        </div>

        <SubmissionSummary
          hasHistory={hasAnamnesis(anamnesis)}
          labTestsCount={countAvailableLabTests(labTests)}
          hasVitalSigns={hasVitalSigns}
        />
      </div>
    </section>
  );
}
