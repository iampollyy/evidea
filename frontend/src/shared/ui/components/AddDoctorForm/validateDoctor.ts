import type { FormErrors } from '@/shared/lib/form/useValidatedForm';
import type { Sex } from '@/shared/lib/person/sex';
import {
  validateBirthDate,
  validateEmail,
  validatePersonName,
  validatePhone,
  validateRequiredChoice,
} from '@/shared/lib/validation/person';
import type { DoctorRole } from './doctorOptions';

export interface AddDoctorFormValues {
  name: string;
  surname: string;
  birthDate: string;
  sex: Sex | '';
  email: string;
  phoneNumber: string;
  role: DoctorRole | '';
}

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

const MIN_DOCTOR_AGE = 18;
const MAX_DOCTOR_AGE = 100;

export function validateDoctor(
  values: AddDoctorFormValues,
  today: Date = new Date(),
): FormErrors<AddDoctorFormValues> {
  return {
    name: validatePersonName(values.name, 'Name'),
    surname: validatePersonName(values.surname, 'Surname'),
    birthDate: values.birthDate
      ? validateBirthDate(values.birthDate, {
          today,
          minAge: MIN_DOCTOR_AGE,
          maxAge: MAX_DOCTOR_AGE,
          minAgeMessage: `Doctor must be at least ${MIN_DOCTOR_AGE} years old`,
        })
      : undefined,
    email: validateEmail(values.email),
    phoneNumber: validatePhone(values.phoneNumber, { required: false }),
    role: validateRequiredChoice(values.role, 'role'),
  };
}
