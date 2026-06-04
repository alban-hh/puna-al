import { z } from 'zod';
import { emptyToUndefined, optionalUrl } from '@/validation/fields';

export const applicationSchema = z.object({
  cover_letter: z.preprocess(
    emptyToUndefined,
    z.string().max(5000, 'Letra motivuese duhet të jetë deri në 5000 karaktere.').optional(),
  ),
  cv_url: optionalUrl,
});

export type ApplicationValues = z.infer<typeof applicationSchema>;
