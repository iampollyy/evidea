import { VITAL_FIELD_ORDER, VITAL_RULES } from '@/constants/vitalSigns.constants';
import type { FormErrors, VitalRule, VitalSignsFormValues } from '@/types/forms.types';

function validateMeasurement(raw: string, { label, min, max, decimals }: VitalRule) {
  const value = raw.trim();
  if (!value) return undefined;

  const pattern = decimals > 0 ? new RegExp(`^\\d+(\\.\\d{1,${decimals}})?$`) : /^\d+$/;
  if (!pattern.test(value)) {
    return decimals > 0
      ? `${label} must be a number with at most ${decimals} decimal place`
      : `${label} must be a whole number`;
  }

  const number = Number(value);
  if (number < min || number > max) return `${label} must be between ${min} and ${max}`;
  return undefined;
}

export function validateVitalSigns(values: VitalSignsFormValues): FormErrors<VitalSignsFormValues> {
  const errors: FormErrors<VitalSignsFormValues> = Object.fromEntries(
    VITAL_FIELD_ORDER.map((field) => [
      field,
      validateMeasurement(values[field], VITAL_RULES[field]),
    ]),
  );

  if (VITAL_FIELD_ORDER.every((field) => !values[field].trim())) {
    errors.weightKg = 'Enter at least one measurement';
  }

  return errors;
}
