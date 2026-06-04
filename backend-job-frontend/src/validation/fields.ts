import { z } from 'zod';

export const emptyToUndefined = (value: unknown): unknown =>
  typeof value === 'string' && value.trim() === '' ? undefined : value;

export const emailSchema = z
  .string()
  .trim()
  .min(1, 'Email-i është i detyrueshëm.')
  .email('Shkruani një adresë email të vlefshme.');

export const passwordSchema = z
  .string()
  .min(8, 'Fjalëkalimi duhet të jetë 8–128 karaktere.')
  .max(128, 'Fjalëkalimi duhet të jetë 8–128 karaktere.');

export const fullNameSchema = z
  .string()
  .trim()
  .min(1, 'Emri është i detyrueshëm.')
  .max(120, 'Emri duhet të jetë deri në 120 karaktere.');

export const niptSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(
    /^[A-Z]\d{8}[A-Z]$/,
    'NIPT-i duhet të ketë 10 karaktere: një shkronjë, 8 shifra, një shkronjë (p.sh. K12345678L).',
  );

const ALBANIAN_PHONE = /^\+355\d{8,9}$/;
const PHONE_MESSAGE =
  'Numri duhet të fillojë me +355 i ndjekur nga 8–9 shifra (p.sh. +355681234567).';

export const albanianPhoneSchema = z.string().trim().regex(ALBANIAN_PHONE, PHONE_MESSAGE);

export const optionalAlbanianPhone = z.preprocess(
  emptyToUndefined,
  z.string().trim().regex(ALBANIAN_PHONE, PHONE_MESSAGE).optional(),
);

export const optionalUrl = z.preprocess(
  emptyToUndefined,
  z.string().trim().url('Shkruani një URL të vlefshme (p.sh. https://example.al).').optional(),
);
