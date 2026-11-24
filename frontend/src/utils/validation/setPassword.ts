import {
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  PASSWORD_RULES,
} from '@/constants/forms.constants';
import type { FormErrors, SetPasswordFormValues } from '@/shared/types/forms.types';

export function validatePassword(value: string) {
  const password = value.trim();
  if (!password) return 'Password is required';
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `Password must be at least ${PASSWORD_MIN_LENGTH} characters`;
  }
  if (password.length > PASSWORD_MAX_LENGTH) {
    return `Password must be at most ${PASSWORD_MAX_LENGTH} characters`;
  }
  return PASSWORD_RULES.find((rule) => !rule.test(password))?.message;
}

export function validateSetPassword(
  values: SetPasswordFormValues,
): FormErrors<SetPasswordFormValues> {
  const confirmPassword = values.confirmPassword.trim();
  return {
    password: validatePassword(values.password),
    confirmPassword: !confirmPassword
      ? 'Please confirm your password'
      : confirmPassword !== values.password.trim()
        ? 'Passwords do not match'
        : undefined,
  };
}
