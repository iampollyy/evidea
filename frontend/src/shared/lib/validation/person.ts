const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^\+?[\d\s()-]+$/;
const NAME_PATTERN = /^[\p{L}\s'-]+$/u;

export function toIsoDate(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

export function parseIsoDate(value: string) {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function getAge(birthDate: Date, today: Date) {
  const age = today.getFullYear() - birthDate.getFullYear();
  const hadBirthday =
    today.getMonth() > birthDate.getMonth() ||
    (today.getMonth() === birthDate.getMonth() && today.getDate() >= birthDate.getDate());
  return hadBirthday ? age : age - 1;
}

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

interface BirthDateRules {
  today: Date;
  minAge?: number;
  maxAge: number;
  minAgeMessage?: string;
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
