export interface VitalSignsValues {
  weightKg: number | null;
  systolicBpMmhg: number | null;
  diastolicBpMmhg: number | null;
  heartRateBpm: number | null;
  respiratoryRate: number | null;
  bodyTempCelsius: number | null;
  spo2Percent: number | null;
}

export interface VitalSignsRecord extends VitalSignsValues {
  id: string;
  createdAt: string;
}

export interface AnamnesisValues {
  chiefComplaint: string | null;
  symptomsDuration: string | null;
  clinicalNotes: string | null;
  familyHistory: string | null;
  medications: string | null;
  pastMedicalHistory: string | null;
  allergies: string | null;
}

export type AnamnesisFormValues = Record<keyof AnamnesisValues, string>;
