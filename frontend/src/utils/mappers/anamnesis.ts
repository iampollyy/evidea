import type { AnamnesisFormValues, AnamnesisValues } from '@/shared/types/cases.types';

const toNullable = (value: string) => value.trim() || null;

export function toAnamnesisFormValues(anamnesis: AnamnesisValues | null): AnamnesisFormValues {
  return {
    chiefComplaint: anamnesis?.chiefComplaint ?? '',
    symptomsDuration: anamnesis?.symptomsDuration ?? '',
    clinicalNotes: anamnesis?.clinicalNotes ?? '',
    familyHistory: anamnesis?.familyHistory ?? '',
    medications: anamnesis?.medications ?? '',
    pastMedicalHistory: anamnesis?.pastMedicalHistory ?? '',
    allergies: anamnesis?.allergies ?? '',
  };
}

export function toAnamnesisValues(values: AnamnesisFormValues): AnamnesisValues {
  return {
    chiefComplaint: toNullable(values.chiefComplaint),
    symptomsDuration: toNullable(values.symptomsDuration),
    clinicalNotes: toNullable(values.clinicalNotes),
    familyHistory: toNullable(values.familyHistory),
    medications: toNullable(values.medications),
    pastMedicalHistory: toNullable(values.pastMedicalHistory),
    allergies: toNullable(values.allergies),
  };
}
