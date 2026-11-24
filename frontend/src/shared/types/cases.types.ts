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
