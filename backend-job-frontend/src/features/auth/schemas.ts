import { z } from 'zod';
import {
  emailSchema,
  fullNameSchema,
  optionalAlbanianPhone,
  passwordSchema,
} from '@/validation/fields';

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Fjalëkalimi është i detyrueshëm.'),
});
export type LoginValues = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  full_name: fullNameSchema,
  email: emailSchema,
  password: passwordSchema,
  phone: optionalAlbanianPhone,
});
export type RegisterValues = z.infer<typeof registerSchema>;

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});
export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirm: z.string(),
  })
  .refine((values) => values.password === values.confirm, {
    message: 'Fjalëkalimet nuk përputhen.',
    path: ['confirm'],
  });
export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

export const resendSchema = z.object({
  email: emailSchema,
});
export type ResendValues = z.infer<typeof resendSchema>;
