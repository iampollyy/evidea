import type { VitalSignsValues } from './cases.types';
import type { DoctorRole } from './doctors.types';
import type { Sex } from './person.types';

export type FormErrors<T> = Partial<Record<keyof T, string>>;

export type FieldName<T> = keyof T & string;

export type StringField<T> = { [K in FieldName<T>]: T[K] extends string ? K : never }[FieldName<T>];

export interface UseValidatedFormOptions<T> {
  initialValues: T;
  validate: (values: T) => FormErrors<T>;
  fieldOrder: FieldName<T>[];
  id?: string;
  disabled?: boolean;
}

export interface AddDoctorFormValues {
  name: string;
  surname: string;
  birthDate: string;
  sex: Sex | '';
  email: string;
  phoneNumber: string;
  role: DoctorRole | '';
}

export interface AddPatientFormValues {
  name: string;
  surname: string;
  birthDate: string;
  sex: Sex | '';
  email: string;
  phoneNumber: string;
}

export type PersonalInfoValues = AddPatientFormValues;

export interface LoginFormValues {
  email: string;
  password: string;
}

export interface SetPasswordFormValues {
  password: string;
  confirmPassword: string;
}

export interface PasswordRule {
  test: (value: string) => boolean;
  message: string;
}

export type VitalSignsFormValues = Record<keyof VitalSignsValues, string>;

export interface VitalRule {
  label: string;
  min: number;
  max: number;
  decimals: number;
}
