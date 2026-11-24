import type { VitalSignsValues } from '@/shared/api/cases.types';
import type { FormErrors } from '@/shared/lib/form/useValidatedForm';

export type VitalSignsFormValues = Record<keyof VitalSignsValues, string>;

interface VitalRule {
  label: string;
  min: number;
  max: number;
  decimals: number;
}

export const VITAL_RULES: Record<keyof VitalSignsValues, VitalRule> = {
  weightKg: { label: 'Weight', min: 0.1, max: 500, decimals: 1 },
  systolicBpMmhg: { label: 'Systolic pressure', min: 20, max: 300, decimals: 0 },
  diastolicBpMmhg: { label: 'Diastolic pressure', min: 20, max: 300, decimals: 0 },
  heartRateBpm: { label: 'Heart rate', min: 10, max: 300, decimals: 0 },
  respiratoryRate: { label: 'Respiratory rate', min: 1, max: 120, decimals: 0 },
  bodyTempCelsius: { label: 'Body temperature', min: 25, max: 45, decimals: 1 },
  spo2Percent: { label: 'Oxygen saturation', min: 0, max: 100, decimals: 0 },
};

export const VITAL_FIELD_ORDER = Object.keys(VITAL_RULES) as (keyof VitalSignsValues)[];

export function toVitalFormValues(vitals: VitalSignsValues | null): VitalSignsFormValues {
  return Object.fromEntries(
    VITAL_FIELD_ORDER.map((field) => {
      const value = vitals?.[field];
      return [field, value == null ? '' : String(value)];
    }),
  ) as VitalSignsFormValues;
}

export function toVitalValues(values: VitalSignsFormValues): VitalSignsValues {
  return Object.fromEntries(
    VITAL_FIELD_ORDER.map((field) => {
      const raw = values[field].trim();
      return [field, raw === '' ? null : Number(raw)];
    }),
  ) as unknown as VitalSignsValues;
}

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
