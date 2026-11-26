import type { LabResultStatus } from '@/shared/types/labResults.types';
import type { BadgeVariant } from '@/shared/ui/atoms/Badge/Badge';

export const LAB_RESULT_STATUSES: Record<
  LabResultStatus,
  { label: string; variant: BadgeVariant }
> = {
  completed: { label: 'Completed', variant: 'success' },
  pending: { label: 'Pending', variant: 'warning' },
  notAvailable: { label: 'Not Available', variant: 'neutral' },
};

export const LAB_RESULT_COLUMNS = [
  'Test / Investigation',
  'Category',
  'Date',
  'Status',
  'Result summary',
] as const;

export const LAB_RESULT_NOT_SCHEDULED = 'Not scheduled';
