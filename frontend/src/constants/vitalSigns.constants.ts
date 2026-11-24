import type { VitalSignsValues } from '@/shared/types/cases.types';
import type { VitalRule } from '@/shared/types/forms.types';

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
