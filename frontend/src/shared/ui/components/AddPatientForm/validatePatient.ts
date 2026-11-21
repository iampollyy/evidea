import type { FormErrors } from '@/shared/lib/form/useValidatedForm';
import type { Sex } from '@/shared/lib/person/sex';
import {
  validateBirthDate,
  validateEmail,
  validatePersonName,
  validatePhone,
  validateRequiredChoice,
} from '@/shared/lib/validation/person';

export interface AddPatientFormValues {
  name: string;
  surname: string;
  birthDate: string;
  sex: Sex | '';
  email: string;
  phoneNumber: string;
}

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

const MAX_PATIENT_AGE = 130;

export function validatePatient(
  values: AddPatientFormValues,
  today: Date = new Date(),
): FormErrors<AddPatientFormValues> {
  return {
    name: validatePersonName(values.name, 'Name'),
    surname: validatePersonName(values.surname, 'Surname'),
    birthDate: validateBirthDate(values.birthDate, { today, maxAge: MAX_PATIENT_AGE }),
    sex: validateRequiredChoice(values.sex, 'sex'),
    email: validateEmail(values.email),
    phoneNumber: validatePhone(values.phoneNumber, { required: false }),
  };
}
