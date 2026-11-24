import type { Option } from '@/shared/types/common.types';
import type { Sex } from '@/shared/types/person.types';

export const SEXES = ['male', 'female', 'other', 'unknown'] as const satisfies readonly Sex[];

export const SEX_OPTIONS: Option<Sex>[] = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
  { value: 'unknown', label: 'Unknown' },
];
