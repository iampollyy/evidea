import type { LabResultStatus } from '@/shared/types/labResults.types';

export const CASE_REVIEW_LAB_STATUSES: Record<LabResultStatus, { label: string; icon: string }> = {
  completed: { label: 'Available', icon: 'check' },
  pending: { label: 'Pending', icon: 'schedule' },
  notAvailable: { label: 'Not available', icon: 'remove' },
};

export const CASE_REVIEW_LAB_CATEGORY = 'Laboratory result';

export const CASE_REVIEW_MISMATCH_ERROR = 'This clinical case does not belong to the patient.';

export const CASE_REVIEW_INFO =
  'Clinical data associated with this case will be used as input for diagnostic analysis.';
