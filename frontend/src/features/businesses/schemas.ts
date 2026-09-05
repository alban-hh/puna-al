import { z } from 'zod';
import { QARKS, type Qark } from '@/api';
import { albanianPhoneSchema, niptSchema, optionalUrl } from '@/validation/fields';

const qarkEnum = z.enum([...QARKS] as [Qark, ...Qark[]], {
  errorMap: () => ({ message: 'Zgjidhni një qark.' }),
});

const baseBusinessFields = {
  name: z
    .string()
    .trim()
    .min(2, 'Emri duhet të jetë 2–160 karaktere.')
    .max(160, 'Emri duhet të jetë 2–160 karaktere.'),
  description: z
    .string()
    .trim()
    .min(10, 'Përshkrimi duhet të jetë 10–5000 karaktere.')
    .max(5000, 'Përshkrimi duhet të jetë 10–5000 karaktere.'),
  qark: qarkEnum,
  city: z
    .string()
    .trim()
    .min(2, 'Qyteti duhet të jetë 2–120 karaktere.')
    .max(120, 'Qyteti duhet të jetë 2–120 karaktere.'),
  address: z
    .string()
    .trim()
    .min(5, 'Adresa duhet të jetë 5–240 karaktere.')
    .max(240, 'Adresa duhet të jetë 5–240 karaktere.'),
  phone: albanianPhoneSchema,
  website: optionalUrl,
  logo_url: optionalUrl,
};

export const createBusinessSchema = z.object({
  ...baseBusinessFields,
  nipt: niptSchema,
});
export type CreateBusinessValues = z.infer<typeof createBusinessSchema>;

export const updateBusinessSchema = z.object(baseBusinessFields);
export type UpdateBusinessValues = z.infer<typeof updateBusinessSchema>;
