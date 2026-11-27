import type { DiseaseHypothesis, EvidenceFactor } from '@/shared/types/predictions.types';

export const hypothesesMock: DiseaseHypothesis[] = [
  {
    id: 'hypothesis-1',
    rank: 1,
    score: 0.78,
    disease: {
      id: 'disease-dmd',
      orphaCode: 'ORPHA:98896',
      name: 'Duchenne Muscular Dystrophy',
      icdCode: 'G71.0',
      inheritanceType: 'X-linked recessive',
    },
  },
  {
    id: 'hypothesis-2',
    rank: 2,
    score: 0.64,
    disease: {
      id: 'disease-lgmd',
      orphaCode: 'ORPHA:263',
      name: 'Limb-Girdle Muscular Dystrophy',
      icdCode: 'G71.09',
      inheritanceType: 'Autosomal recessive',
    },
  },
  {
    id: 'hypothesis-3',
    rank: 3,
    score: 0.31,
    disease: {
      id: 'disease-pompe',
      orphaCode: 'ORPHA:365',
      name: 'Pompe Disease',
      icdCode: 'E74.02',
      inheritanceType: 'Autosomal recessive',
    },
  },
  {
    id: 'hypothesis-4',
    rank: 4,
    score: 0.24,
    disease: {
      id: 'disease-bmd',
      orphaCode: 'ORPHA:98895',
      name: 'Becker Muscular Dystrophy',
      icdCode: 'G71.01',
      inheritanceType: 'X-linked recessive',
    },
  },
];

export const clinicalFactorsMock: EvidenceFactor[] = [
  { label: 'Progressive muscle weakness', contribution: 0.19 },
  { label: 'Dysphagia', contribution: 0.13 },
  { label: 'Family history — neuromuscular', contribution: 0.11 },
];

export const labFactorsMock: EvidenceFactor[] = [
  { label: 'CK 1850 U/L', contribution: 0.24 },
  { label: 'AST 95 U/L', contribution: 0.08 },
  { label: 'ALT 72 U/L', contribution: 0.05 },
];
