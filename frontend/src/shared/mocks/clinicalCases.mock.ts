import type { ClinicalCaseOption } from '@/shared/types/clinicalCases.types';

export const clinicalCasesMock: ClinicalCaseOption[] = [
  {
    id: 'case-0142',
    patientCode: 'PT-2026-0025',
    caseCode: 'CASE-0142',
    updatedAt: '2026-11-12',
    hasHistory: true,
    labTestsCount: 4,
    status: 'approved',
  },
  {
    id: 'case-0138',
    patientCode: 'PT-2026-0025',
    caseCode: 'CASE-0138',
    updatedAt: '2026-11-10',
    hasHistory: true,
    labTestsCount: 6,
    status: 'dismissed',
  },
  {
    id: 'case-0129',
    patientCode: 'PT-2026-0025',
    caseCode: 'CASE-0129',
    updatedAt: '2026-09-04',
    hasHistory: true,
    labTestsCount: 3,
    status: 'noCase',
  },
  {
    id: 'case-0124',
    patientCode: 'PT-2026-0025',
    caseCode: 'CASE-0124',
    updatedAt: '2026-06-03',
    hasHistory: true,
    labTestsCount: 2,
    status: 'noCase',
  },
];
