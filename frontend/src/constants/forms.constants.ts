import type {
  AddDoctorFormValues,
  AddPatientFormValues,
  LoginFormValues,
  PasswordRule,
  SetPasswordFormValues,
} from '@/shared/types/forms.types';

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PHONE_PATTERN = /^\+?[\d\s()-]+$/;
export const NAME_PATTERN = /^[\p{L}\s'-]+$/u;

export const EMPTY_DOCTOR: AddDoctorFormValues = {
  name: '',
  surname: '',
  birthDate: '',
  sex: '',
  email: '',
  phoneNumber: '',
  role: '',
};

export const DOCTOR_FIELD_ORDER: (keyof AddDoctorFormValues)[] = [
  'name',
  'surname',
  'birthDate',
  'sex',
  'email',
  'phoneNumber',
  'role',
];

export const MIN_DOCTOR_AGE = 18;
export const MAX_DOCTOR_AGE = 100;

export const EMPTY_PATIENT: AddPatientFormValues = {
  name: '',
  surname: '',
  birthDate: '',
  sex: '',
  email: '',
  phoneNumber: '',
};

export const PATIENT_FIELD_ORDER: (keyof AddPatientFormValues)[] = [
  'name',
  'surname',
  'birthDate',
  'sex',
  'email',
  'phoneNumber',
];

export const MAX_PATIENT_AGE = 130;

export const EMPTY_LOGIN: LoginFormValues = {
  email: '',
  password: '',
};

export const LOGIN_FIELD_ORDER: (keyof LoginFormValues)[] = ['email', 'password'];

export const EMPTY_SET_PASSWORD: SetPasswordFormValues = {
  password: '',
  confirmPassword: '',
};

export const SET_PASSWORD_FIELD_ORDER: (keyof SetPasswordFormValues)[] = [
  'password',
  'confirmPassword',
];

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;

export const PASSWORD_HINT =
  'At least 8 characters with an uppercase letter, a lowercase letter, a digit and a special character';

export const PASSWORD_RULES: PasswordRule[] = [
  { test: (value) => /[A-Z]/.test(value), message: 'Password must contain an uppercase letter' },
  { test: (value) => /[a-z]/.test(value), message: 'Password must contain a lowercase letter' },
  { test: (value) => /[0-9]/.test(value), message: 'Password must contain a digit' },
  {
    test: (value) => /[^A-Za-z0-9]/.test(value),
    message: 'Password must contain a special character',
  },
];
