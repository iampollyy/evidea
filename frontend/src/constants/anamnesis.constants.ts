import type { AnamnesisValues } from '@/shared/types/cases.types';

export const ANAMNESIS_NOTES_HINT =
  'Clinical notes support unrestricted natural-language entry. No symptom codes are required.';

export const ANAMNESIS_FIELDS: { id: keyof AnamnesisValues; label: string }[] = [
  { id: 'chiefComplaint', label: 'Chief Complaint' },
  { id: 'symptomsDuration', label: 'History of Present Illness' },
  { id: 'pastMedicalHistory', label: 'Past Medical History' },
  { id: 'familyHistory', label: 'Family History' },
  { id: 'medications', label: 'Medication History' },
  { id: 'allergies', label: 'Allergies' },
];
