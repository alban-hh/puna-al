import { z } from 'zod';
import {
  EMPLOYMENT_TYPES,
  QARKS,
  SALARY_PERIODS,
  type CreateJobRequest,
  type EmploymentType,
  type Qark,
} from '@/api';
import { emptyToUndefined } from '@/validation/fields';

const optionalPositiveInt = z.preprocess(
  emptyToUndefined,
  z.coerce
    .number({ invalid_type_error: 'Shkruani një numër të vlefshëm.' })
    .int('Duhet të jetë numër i plotë.')
    .min(0, 'Nuk mund të jetë negative.')
    .optional(),
);

export const jobSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(3, 'Titulli duhet të jetë 3–160 karaktere.')
      .max(160, 'Titulli duhet të jetë 3–160 karaktere.'),
    description: z
      .string()
      .trim()
      .min(20, 'Përshkrimi duhet të jetë 20–10000 karaktere.')
      .max(10000, 'Përshkrimi duhet të jetë 20–10000 karaktere.'),
    category: z.string().min(1, 'Zgjidhni një kategori.'),
    employment_type: z.enum([...EMPLOYMENT_TYPES] as [EmploymentType, ...EmploymentType[]], {
      errorMap: () => ({ message: 'Zgjidhni llojin e punësimit.' }),
    }),
    qark: z.enum([...QARKS] as [Qark, ...Qark[]], {
      errorMap: () => ({ message: 'Zgjidhni një qark.' }),
    }),
    city: z
      .string()
      .trim()
      .min(2, 'Qyteti duhet të jetë 2–120 karaktere.')
      .max(120, 'Qyteti duhet të jetë 2–120 karaktere.'),
    remote: z.boolean(),
    salary_min: optionalPositiveInt,
    salary_max: optionalPositiveInt,
    salary_period: z.preprocess(emptyToUndefined, z.enum(SALARY_PERIODS).optional()),
    expires_at: z.preprocess(emptyToUndefined, z.string().optional()),
  })
  .superRefine((values, ctx) => {
    const hasSalary = values.salary_min != null || values.salary_max != null;
    if (hasSalary && !values.salary_period) {
      ctx.addIssue({
        path: ['salary_period'],
        code: z.ZodIssueCode.custom,
        message: 'Zgjidhni periudhën e pagës kur vendosni pagë.',
      });
    }
    if (
      values.salary_min != null &&
      values.salary_max != null &&
      values.salary_max < values.salary_min
    ) {
      ctx.addIssue({
        path: ['salary_max'],
        code: z.ZodIssueCode.custom,
        message: 'Paga maksimale duhet të jetë më e madhe ose e barabartë me minimalen.',
      });
    }
  });

export type JobFormValues = z.infer<typeof jobSchema>;

export function isoToLocalInput(iso: string | null): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

export function jobValuesToPayload(values: JobFormValues): Omit<CreateJobRequest, 'business_id'> {
  return {
    title: values.title,
    description: values.description,
    category: values.category,
    employment_type: values.employment_type,
    qark: values.qark,
    city: values.city,
    remote: values.remote,
    salary_min: values.salary_min ?? null,
    salary_max: values.salary_max ?? null,
    salary_period: values.salary_period ?? null,
    expires_at: values.expires_at ? new Date(values.expires_at).toISOString() : null,
  };
}
