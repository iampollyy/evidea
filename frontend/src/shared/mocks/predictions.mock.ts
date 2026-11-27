import type {
  DiseaseHypothesis,
  EvidenceFactor,
  HypothesisExplanation,
} from '@/shared/types/predictions.types';

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

export const explanationsMock: Record<string, HypothesisExplanation> = {
  'hypothesis-1': {
    shap: [
      { id: 'ck', label: 'CK = 1850 U/L', source: 'laboratory', value: 0.24 },
      { id: 'weakness', label: 'Progressive muscle weakness', source: 'clinical', value: 0.19 },
      { id: 'dysphagia', label: 'Dysphagia', source: 'clinical', value: 0.13 },
      { id: 'family', label: 'Family history — neuromuscular', source: 'clinical', value: 0.11 },
      { id: 'ast', label: 'AST = 95 U/L', source: 'laboratory', value: 0.08 },
      { id: 'alt', label: 'ALT = 72 U/L', source: 'laboratory', value: 0.05 },
      { id: 'age', label: 'Age (34 years)', source: 'clinical', value: -0.04 },
      { id: 'crp', label: 'CRP = 3.2 mg/L', source: 'laboratory', value: -0.02 },
    ],
    lime: [
      { id: 'ck', label: 'CK > 1000 U/L', source: 'laboratory', value: 0.27 },
      { id: 'weakness', label: 'Progressive muscle weakness', source: 'clinical', value: 0.16 },
      { id: 'family', label: 'Family history — neuromuscular', source: 'clinical', value: 0.14 },
      { id: 'dysphagia', label: 'Dysphagia', source: 'clinical', value: 0.09 },
      { id: 'ast', label: 'AST > 40 U/L', source: 'laboratory', value: 0.06 },
      { id: 'age', label: 'Age > 18 years', source: 'clinical', value: -0.07 },
      { id: 'crp', label: 'CRP ≤ 5 mg/L', source: 'laboratory', value: -0.01 },
    ],
  },
  'hypothesis-2': {
    shap: [
      { id: 'weakness', label: 'Progressive muscle weakness', source: 'clinical', value: 0.21 },
      { id: 'ck', label: 'CK = 1850 U/L', source: 'laboratory', value: 0.15 },
      { id: 'age', label: 'Age (34 years)', source: 'clinical', value: 0.09 },
      { id: 'ast', label: 'AST = 95 U/L', source: 'laboratory', value: 0.04 },
      { id: 'family', label: 'Family history — neuromuscular', source: 'clinical', value: -0.06 },
      { id: 'dysphagia', label: 'Dysphagia', source: 'clinical', value: -0.03 },
    ],
    lime: [
      { id: 'weakness', label: 'Progressive muscle weakness', source: 'clinical', value: 0.18 },
      { id: 'ck', label: 'CK > 1000 U/L', source: 'laboratory', value: 0.17 },
      { id: 'age', label: 'Age > 18 years', source: 'clinical', value: 0.11 },
      { id: 'family', label: 'Family history — neuromuscular', source: 'clinical', value: -0.08 },
    ],
  },
  'hypothesis-3': {
    shap: [
      { id: 'dysphagia', label: 'Dysphagia', source: 'clinical', value: 0.12 },
      { id: 'ck', label: 'CK = 1850 U/L', source: 'laboratory', value: 0.07 },
      { id: 'alt', label: 'ALT = 72 U/L', source: 'laboratory', value: 0.05 },
      { id: 'family', label: 'Family history — neuromuscular', source: 'clinical', value: -0.11 },
      { id: 'weakness', label: 'Progressive muscle weakness', source: 'clinical', value: -0.04 },
    ],
    lime: [
      { id: 'dysphagia', label: 'Dysphagia', source: 'clinical', value: 0.1 },
      { id: 'alt', label: 'ALT > 40 U/L', source: 'laboratory', value: 0.06 },
      { id: 'family', label: 'Family history — neuromuscular', source: 'clinical', value: -0.13 },
    ],
  },
  'hypothesis-4': {
    shap: [
      { id: 'ck', label: 'CK = 1850 U/L', source: 'laboratory', value: 0.14 },
      { id: 'family', label: 'Family history — neuromuscular', source: 'clinical', value: 0.08 },
      { id: 'age', label: 'Age (34 years)', source: 'clinical', value: 0.06 },
      { id: 'weakness', label: 'Progressive muscle weakness', source: 'clinical', value: -0.09 },
      { id: 'dysphagia', label: 'Dysphagia', source: 'clinical', value: -0.07 },
    ],
    lime: [
      { id: 'ck', label: 'CK > 1000 U/L', source: 'laboratory', value: 0.12 },
      { id: 'age', label: 'Age > 18 years', source: 'clinical', value: 0.08 },
      { id: 'weakness', label: 'Progressive muscle weakness', source: 'clinical', value: -0.1 },
    ],
  },
};
