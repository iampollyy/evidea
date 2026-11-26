import sampleImage from '@/assets/sample-image.jpg';
import type { AnamnesisValues, VitalSignsValues } from '@/shared/types/cases.types';
import type { PatientBannerPatient } from '@/shared/ui/components/PatientBanner/PatientBanner';
import type { PersonalInfoValues } from '@/shared/types/forms.types';

export const patientBannerMock: PatientBannerPatient = {
  code: '#3F9A1C2E',
  name: 'Alberto',
  surname: 'Ripley',
  birthDate: '1998-01-25',
  sex: 'male',
  status: 'active',
  phoneNumber: '+370 612 45 648',
  lastVisit: new Date(2026, 4, 18),
  photoSrc: sampleImage,
};

export const personalInfoMock: PersonalInfoValues = {
  name: 'Alberto',
  surname: 'Ripley',
  birthDate: '1998-01-25',
  sex: 'male',
  email: 'alberto.ripley@example.com',
  phoneNumber: '+370 612 45 648',
};

export const vitalSignsMock: VitalSignsValues = {
  weightKg: 27.4,
  systolicBpMmhg: 102,
  diastolicBpMmhg: 66,
  heartRateBpm: 89,
  respiratoryRate: 24,
  bodyTempCelsius: 36.8,
  spo2Percent: 98,
};

export const vitalSignsMeasuredAtMock = '2026-05-18T10:45:00';

export const anamnesisMock: AnamnesisValues = {
  clinicalNotes:
    'Alberto was referred for assessment of recurrent episodes of fatigue, reduced exercise tolerance, and intermittent muscle weakness over the past nine months. His parents also report delayed recovery after minor respiratory infections. School performance remains stable. No loss of consciousness or recent acute deterioration.',
  chiefComplaint: 'Fatigue, reduced exercise tolerance, intermittent muscle weakness.',
  symptomsDuration:
    'Symptoms began approximately nine months ago and are more apparent after physical activity.',
  pastMedicalHistory:
    'Two hospital admissions for dehydration before age 5. Routine immunisations complete.',
  familyHistory:
    'Maternal cousin with unexplained childhood muscle weakness. No known consanguinity.',
  medications: 'Daily vitamin D supplement. No regular prescription medication.',
  allergies: 'No known drug allergies. Seasonal pollen sensitivity reported.',
};
