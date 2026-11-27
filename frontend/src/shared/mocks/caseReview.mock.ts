import type { CaseLabTest } from '@/shared/types/caseReview.types';

export const caseLabTestsMock: CaseLabTest[] = [
  { id: 'cbc', name: 'Complete Blood Count', category: 'Laboratory result', status: 'completed' },
  { id: 'crp', name: 'C-reactive Protein', category: 'Laboratory result', status: 'completed' },
  {
    id: 'esr',
    name: 'Erythrocyte Sedimentation Rate',
    category: 'Laboratory result',
    status: 'completed',
  },
  { id: 'metabolic', name: 'Metabolic Panel', category: 'Laboratory result', status: 'completed' },
  { id: 'ferritin', name: 'Ferritin', category: 'Laboratory result', status: 'completed' },
  { id: 'urinalysis', name: 'Urinalysis', category: 'Laboratory result', status: 'completed' },
];
