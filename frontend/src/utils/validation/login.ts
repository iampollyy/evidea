import type { FormErrors, LoginFormValues } from '@/types/forms.types';
import { validateEmail } from './person';

export function validateLogin(values: LoginFormValues): FormErrors<LoginFormValues> {
  return {
    email: validateEmail(values.email),
    password: values.password ? undefined : 'Password is required',
  };
}
