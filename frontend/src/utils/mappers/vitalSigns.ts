import { VITAL_FIELD_ORDER } from '@/constants/vitalSigns.constants';
import type { VitalSignsValues } from '@/types/cases.types';
import type { VitalSignsFormValues } from '@/types/forms.types';

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

export function formatMeasurement(
  vitals: VitalSignsValues | null,
  fields: (keyof VitalSignsValues)[],
) {
  const values = fields.map((field) => vitals?.[field] ?? null);
  if (values.every((value) => value == null)) return null;
  return values.map((value) => value ?? '—').join('/');
}
