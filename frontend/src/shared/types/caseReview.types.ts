import type { PatientBannerPatient } from '@/shared/ui/components/PatientBanner/PatientBanner';
import type { AnamnesisValues, VitalSignsRecord } from './cases.types';
import type { LabResult } from './labResults.types';

export type CaseLabTest = Pick<LabResult, 'id' | 'name' | 'category' | 'status'>;

export interface CaseLabReport {
  id: string;
  panelName: string;
}

export interface CaseDetail {
  id: string;
  patientId: string;
  anamnesis: AnamnesisValues;
  vitalSigns: VitalSignsRecord[];
  labReports: CaseLabReport[];
}

export interface CaseReviewData {
  patient: PatientBannerPatient | null;
  anamnesis: AnamnesisValues | null;
  labTests: CaseLabTest[];
  hasVitalSigns: boolean;
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
}

export interface CaseReviewPageProps {
  patientId: string;
  caseId: string;
  onBack: () => void;
  onSubmit?: () => void;
}
