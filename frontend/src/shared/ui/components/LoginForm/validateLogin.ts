import type { FormErrors } from '@/shared/lib/form/useValidatedForm';
import { validateEmail } from '@/shared/lib/validation/person';

export interface LoginFormValues {
  email: string;
  password: string;
}

export const EMPTY_LOGIN: LoginFormValues = {
  email: '',
  password: '',
};

export const LOGIN_FIELD_ORDER: (keyof LoginFormValues)[] = ['email', 'password'];

export function validateLogin(values: LoginFormValues): FormErrors<LoginFormValues> {
  return {
    email: validateEmail(values.email),
    password: values.password ? undefined : 'Password is required',
  };
}
