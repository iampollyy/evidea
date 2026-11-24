import { EMAIL_PATTERN, NAME_PATTERN, PHONE_PATTERN } from '@/constants/forms.constants';
import type { BirthDateRules } from '@/types/person.types';
import { getAge, parseIsoDate } from '@/utils/date';

export function validatePersonName(value: string, label: string) {
  const trimmed = value.trim();
  if (!trimmed) return `${label} is required`;
  if (trimmed.length < 2) return `${label} must be at least 2 characters`;
  if (!NAME_PATTERN.test(trimmed)) return `${label} can only contain letters, spaces, ' and -`;
  return undefined;
}

export function validateEmail(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return 'Email address is required';
  if (!EMAIL_PATTERN.test(trimmed)) return 'Enter a valid email address';
  return undefined;
}

export function validatePhone(value: string, { required }: { required: boolean }) {
  const trimmed = value.trim();
  if (!trimmed) return required ? 'Phone number is required' : undefined;
  const digits = trimmed.replace(/\D/g, '').length;
  if (!PHONE_PATTERN.test(trimmed) || digits < 7 || digits > 15) {
    return 'Enter a valid phone number';
  }
  return undefined;
}

export function validateBirthDate(
  value: string,
  { today, minAge = 0, maxAge, minAgeMessage }: BirthDateRules,
) {
  if (!value) return 'Date of birth is required';
  const date = parseIsoDate(value);
  if (!date) return 'Enter a valid date';
  if (date > today) return 'Date of birth cannot be in the future';
  const age = getAge(date, today);
  if (age < minAge) return minAgeMessage ?? `Must be at least ${minAge} years old`;
  if (age > maxAge) return 'Enter a valid date of birth';
  return undefined;
}

export function validateRequiredChoice(value: string, label: string) {
  return value ? undefined : `Select a ${label}`;
}
