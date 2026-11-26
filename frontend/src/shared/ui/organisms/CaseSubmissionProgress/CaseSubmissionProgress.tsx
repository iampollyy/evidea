import {
  CASE_SUBMISSION_COPY,
  CASE_SUBMISSION_DISCLAIMER,
  CASE_SUBMISSION_PROGRESS,
  CASE_SUBMISSION_STEPS,
} from '@/constants/caseSubmission.constants';
import type { CaseSubmissionStage, ProgressStepStatus } from '@/shared/types/predictions.types';
import { ProgressBar } from '@/shared/ui/atoms/ProgressBar/ProgressBar';
import { ProgressStep } from '@/shared/ui/atoms/ProgressStep/ProgressStep';
import { Spinner } from '@/shared/ui/atoms/Spinner/Spinner';
import styles from './CaseSubmissionProgress.module.scss';

export interface CaseSubmissionProgressProps {
  stage: CaseSubmissionStage;
  patientName: string;
  className?: string;
}

function getStepStatus(stepIndex: number, activeIndex: number): ProgressStepStatus {
  if (stepIndex < activeIndex) return 'done';
  if (stepIndex === activeIndex) return 'active';
  return 'upcoming';
}

export function CaseSubmissionProgress({
  stage,
  patientName,
  className,
}: CaseSubmissionProgressProps) {
  const copy = CASE_SUBMISSION_COPY[stage];
  const activeIndex = CASE_SUBMISSION_STEPS.findIndex((step) => step.id === stage);
  const classes = [styles.root, className].filter(Boolean).join(' ');

  return (
    <section className={classes} aria-busy="true" aria-labelledby="case-submission-title">
      <Spinner className={styles.spinner} label={copy.title} />
      <p className={styles.eyebrow}>{copy.eyebrow}</p>
      <h1 id="case-submission-title" className={styles.title}>
        {copy.title}
      </h1>
      <p className={styles.description} aria-live="polite">
        {copy.description(patientName)}
      </p>
      <ProgressBar
        className={styles.progress}
        value={CASE_SUBMISSION_PROGRESS[stage]}
        label={copy.title}
      />
      <ol className={styles.steps}>
        {CASE_SUBMISSION_STEPS.map((step, index) => {
          const status = getStepStatus(index, activeIndex);
          return (
            <li key={step.id}>
              <ProgressStep status={status} aria-current={status === 'active' ? 'step' : undefined}>
                {status === 'done' ? step.doneLabel : step.activeLabel}
              </ProgressStep>
            </li>
          );
        })}
      </ol>
      <p className={styles.disclaimer}>{CASE_SUBMISSION_DISCLAIMER}</p>
    </section>
  );
}
