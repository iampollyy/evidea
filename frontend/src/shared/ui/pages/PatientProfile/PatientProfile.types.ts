import type { MouseEvent } from 'react';

import type { PatientBannerPatient } from '@/shared/ui/components/PatientBanner/PatientBanner';
import type { PersonalInfoFormProps } from '@/shared/ui/organisms/PersonalInfoForm/PersonalInfoForm';
import type { VitalSignsFormProps } from '@/shared/ui/organisms/VitalSignsForm/VitalSignsForm';
import type { PatientProfileTab } from './PatientProfile.constants';

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
