import type { MouseEvent } from 'react';

import type { PATIENT_PROFILE_TABS } from '@/constants/patientProfile.constants';
import type { PatientBannerPatient } from '@/shared/ui/components/PatientBanner/PatientBanner';
import type { PersonalInfoFormProps } from '@/shared/ui/organisms/PersonalInfoForm/PersonalInfoForm';
import type { VitalSignsFormProps } from '@/shared/ui/organisms/VitalSignsForm/VitalSignsForm';
import type { VitalSignsRecord } from './cases.types';
import type { PatientDetail } from './patients.types';

export type PatientProfileTab = (typeof PATIENT_PROFILE_TABS)[number]['id'];

export interface PatientProfileNavigationProps {
  activeTab: PatientProfileTab;
  getTabHref: (tab: PatientProfileTab) => string;
  onTabNavigate?: (tab: PatientProfileTab, event: MouseEvent<HTMLAnchorElement>) => void;
  backHref: string;
  onBack?: (event: MouseEvent<HTMLAnchorElement>) => void;
}

export interface PatientProfileData {
  patient: PatientBannerPatient | null;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  personalInfo: PersonalInfoFormProps | null;
  vitalSigns: VitalSignsFormProps;
}

export type PatientProfileProps = PatientProfileNavigationProps & PatientProfileData;

export interface PatientProfilePageProps extends PatientProfileNavigationProps {
  patientId: string;
}

export interface LoadedProfile {
  key: number;
  patient: PatientDetail | null;
  vitals: VitalSignsRecord | null;
  error: string | null;
  vitalsError: string | null;
}

export interface ProfileSectionState {
  isEditing: boolean;
  isSaving: boolean;
  saveError: string | null;
}
