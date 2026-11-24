import type { FormErrors } from '@/shared/lib/form/useValidatedForm';

export interface SetPasswordFormValues {
  password: string;
  confirmPassword: string;
}

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

const PASSWORD_RULES: { test: (value: string) => boolean; message: string }[] = [
  { test: (value) => /[A-Z]/.test(value), message: 'Password must contain an uppercase letter' },
  { test: (value) => /[a-z]/.test(value), message: 'Password must contain a lowercase letter' },
  { test: (value) => /[0-9]/.test(value), message: 'Password must contain a digit' },
  {
    test: (value) => /[^A-Za-z0-9]/.test(value),
    message: 'Password must contain a special character',
  },
];

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
