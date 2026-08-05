import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

export const authUserSchema = z.object({
  id: z.string(),
  email: z.email(),
  first_name: z.string().default(''),
  last_name: z.string().default(''),
  is_verified: z.boolean().optional(),
  is_active: z.boolean().optional(),
  date_joined: z.string().optional(),
  roles: z
    .array(
      z.object({
        organization_id: z.string(),
        organization__name: z.string(),
        role: z.string(),
      })
    )
    .optional(),
});

export const authSessionSchema = z.object({
  access: z.string(),
  access_expires_in: z.number().optional(),
  user: authUserSchema,
});

export const loginSchema = z.object({
  email: z.email('Enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const registerSchema = z
  .object({
    first_name: z.string().min(1, 'First name is required'),
    last_name: z.string().min(1, 'Last name is required'),
    email: z.email('Enter a valid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    password_confirm: z.string(),
  })
  .refine((values) => values.password === values.password_confirm, {
    message: 'Passwords do not match',
    path: ['password_confirm'],
  });

export const registrationResponseSchema = z.object({
  detail: z.string(),
  verification_required: z.boolean(),
  user: authUserSchema,
});

/**
 * Resolvers are wrapped here, next to the schema, so a form imports one thing
 * and no call site can pair a schema with the wrong resolver.
 */
export const loginResolver = zodResolver(loginSchema);
export const registerResolver = zodResolver(registerSchema);

export type AuthUser = z.infer<typeof authUserSchema>;
export type AuthSession = z.infer<typeof authSessionSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type RegistrationResponse = z.infer<typeof registrationResponseSchema>;