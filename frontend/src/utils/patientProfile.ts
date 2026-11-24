import { PATIENT_PROFILE_TABS } from '@/constants/patientProfile.constants';
import type { PatientProfileTab } from '@/types/patientProfile.types';

export function isPatientProfileTab(value: unknown): value is PatientProfileTab {
  return PATIENT_PROFILE_TABS.some((tab) => tab.id === value);
}

export function getPatientProfileTabLabel(tab: PatientProfileTab) {
  return PATIENT_PROFILE_TABS.find((item) => item.id === tab)?.label ?? tab;
}
