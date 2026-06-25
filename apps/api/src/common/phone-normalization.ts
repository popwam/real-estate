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

export function normalizeOptionalPhoneOrThrow(
  value: string | null | undefined,
  field = 'phone',
) {
  const raw = value?.trim();
  if (!raw) return undefined;

  const normalized = normalizePhone(raw);
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
