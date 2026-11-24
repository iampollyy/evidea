export const PATIENT_PROFILE_TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'anamnesis', label: 'Anamnesis' },
  { id: 'laboratory-tests', label: 'Laboratory Tests' },
  { id: 'diagnostics', label: 'Diagnostic Analysis' },
  { id: 'clinical-history', label: 'Clinical History' },
] as const;

export type PatientProfileTab = (typeof PATIENT_PROFILE_TABS)[number]['id'];

export const DEFAULT_PATIENT_PROFILE_TAB: PatientProfileTab = 'overview';

export function isPatientProfileTab(value: unknown): value is PatientProfileTab {
  return PATIENT_PROFILE_TABS.some((tab) => tab.id === value);
}

export const VITALS_LOCAL_ONLY_NOTICE =
  'Measurements were updated on this screen only. The server cannot store measurements outside a clinical case yet, so they will be lost on reload.';
