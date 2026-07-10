import { BadRequestException } from '@nestjs/common';

export function normalizePhone(value: string | null | undefined) {
  const raw = value?.trim();
  if (!raw) return null;

  const compact = raw.replace(/[\s().-]/g, '');
  const international = compact.startsWith('00')
    ? `+${compact.slice(2)}`
    : compact;
  const hasPlus = international.startsWith('+');
  const digits = international.replace(/\D/g, '');

  if (digits.length < 7 || digits.length > 15) {
    return null;
  }

  return hasPlus ? `+${digits}` : digits;
}

export function defaultCountryCode(country: string | null | undefined) {
  const normalized = country?.trim().toLowerCase();
  if (normalized === 'usa' || normalized === 'us' || normalized === 'united states') {
    return '+1';
  }
  return '+20';
}

export function normalizePhoneForCountry(
  value: string | null | undefined,
  country: string | null | undefined,
) {
  const raw = value?.trim();
  if (!raw) return null;

  const compact = raw.replace(/[\s().-]/g, '');
  if (compact.startsWith('+') || compact.startsWith('00')) {
    return normalizePhone(compact);
  }

  const digits = compact.replace(/\D/g, '');
  const countryCode = defaultCountryCode(country);
  if (countryCode === '+20') {
    const local = digits.startsWith('0') ? digits.slice(1) : digits;
    return normalizePhone(`+20${local}`);
  }
  if (countryCode === '+1') {
    return normalizePhone(`+1${digits}`);
  }

  return normalizePhone(`${countryCode}${digits}`);
}

export function normalizeOptionalPhoneOrThrow(
  value: string | null | undefined,
  field = 'phone',
  country?: string | null,
) {
  const raw = value?.trim();
  if (!raw) return undefined;

  const normalized = country ? normalizePhoneForCountry(raw, country) : normalizePhone(raw);
  if (!normalized) {
    throw new BadRequestException(`${field} is invalid.`);
  }

  return normalized;
}

export function phonesMatch(
  first: string | null | undefined,
  second: string | null | undefined,
) {
  const normalizedFirst = normalizePhone(first);
  const normalizedSecond = normalizePhone(second);

  return Boolean(
    normalizedFirst &&
      normalizedSecond &&
      normalizedFirst === normalizedSecond,
  );
}
