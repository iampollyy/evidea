import { SEX_OPTIONS } from '@/constants/person.constants';
import type { Sex } from '@/shared/types/person.types';

export function getSexLabel(sex: Sex | '') {
  return SEX_OPTIONS.find((option) => option.value === sex)?.label;
}
