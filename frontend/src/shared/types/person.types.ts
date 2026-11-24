export type Sex = 'male' | 'female' | 'other' | 'unknown';

export interface BirthDateRules {
  today: Date;
  minAge?: number;
  maxAge: number;
  minAgeMessage?: string;
}
