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

export function toDate(value: Date | string) {
  return value instanceof Date ? value : parseIsoDate(value);
}

export function getAge(birthDate: Date, today: Date) {
  const age = today.getFullYear() - birthDate.getFullYear();
  const hadBirthday =
    today.getMonth() > birthDate.getMonth() ||
    (today.getMonth() === birthDate.getMonth() && today.getDate() >= birthDate.getDate());
  return hadBirthday ? age : age - 1;
}

export function formatAge(birthDate: string) {
  const date = parseIsoDate(birthDate);
  if (!date) return '';
  const age = getAge(date, new Date());
  return age >= 0 ? `${age} ${age === 1 ? 'year' : 'years'}` : '';
}

export function formatAppointmentDate(date: Date | string) {
  if (typeof date === 'string') return date;

  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
      .formatToParts(date)
      .map(({ type, value }) => [type, value]),
  );

  return `${parts.weekday}, ${parts.day} ${parts.month} ${parts.year}`;
}

const createdDateFormatter = new Intl.DateTimeFormat('en', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

export function formatCreatedDate(date: string) {
  const parsedDate = parseIsoDate(date);
  return parsedDate ? createdDateFormatter.format(parsedDate) : date;
}
