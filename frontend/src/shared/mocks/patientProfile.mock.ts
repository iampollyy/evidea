import sampleImage from '@/assets/sample-image.jpg';
import type { VitalSignsValues } from '@/shared/api/cases.types';
import type { PatientBannerPatient } from '@/shared/ui/components/PatientBanner/PatientBanner';
import type { PersonalInfoValues } from '@/shared/ui/organisms/PersonalInfoForm/PersonalInfoForm';

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
