import type { ClinicalCaseStatus } from '@/shared/types/clinicalCases.types';
import type { BadgeVariant } from '@/shared/ui/atoms/Badge/Badge';

export const CLINICAL_CASE_STATUSES: Record<
  ClinicalCaseStatus,
  { label: string; variant: BadgeVariant }
> = {
  approved: { label: 'Approved', variant: 'success' },
  dismissed: { label: 'Dismissed', variant: 'error' },
  noCase: { label: 'No case', variant: 'neutral' },
};

export const CLINICAL_CASE_COLUMNS = [
  'Patient ID',
  'Case ID',
  'Last Updated',
  'Clinical Data',
  'Status',
] as const;
