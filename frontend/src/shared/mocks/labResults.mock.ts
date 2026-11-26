import type { LabResult } from '@/shared/types/labResults.types';

export const labResultsMock: LabResult[] = [
  {
    id: 'cbc',
    name: 'Complete Blood Count (CBC)',
    category: 'Laboratory Test',
    date: '2026-05-18',
    status: 'completed',
    summary: 'Review Required',
    isFlagged: true,
    details:
      'Haemoglobin 10.2 g/dL (low); MCV 72 fL (low). White blood cell and platelet counts within age-adjusted limits.',
  },
  {
    id: 'biochemistry',
    name: 'Blood Biochemistry',
    category: 'Laboratory Test',
    date: '2026-05-18',
    status: 'completed',
    summary: 'Within reference range',
    details: 'Electrolytes, renal and liver function tests within reference range.',
  },
  {
    id: 'genetic-panel',
    name: 'Genetic Testing — Rare Disease Panel',
    category: 'Laboratory Test',
    date: '2026-05-20',
    status: 'pending',
    summary: 'Sample received by laboratory',
    details: 'Sequencing in progress. Expected turnaround 4–6 weeks.',
  },
  {
    id: 'brain-mri',
    name: 'Brain MRI',
    category: 'Instrumental Investigation',
    date: '2026-05-12',
    status: 'completed',
    summary: 'Within reference range',
    details: 'No structural abnormalities detected.',
  },
  {
    id: 'eeg',
    name: 'EEG',
    category: 'Instrumental Investigation',
    date: null,
    status: 'notAvailable',
    summary: 'No study on record',
    details: 'Investigation has not been requested yet.',
  },
];
