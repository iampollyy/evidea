export type ClinicalCaseStatus = 'approved' | 'dismissed' | 'noCase';

export interface ClinicalCaseOption {
  id: string;
  patientCode: string;
  caseCode: string;
  updatedAt: string;
  hasHistory: boolean;
  labTestsCount: number;
  status: ClinicalCaseStatus;
}
