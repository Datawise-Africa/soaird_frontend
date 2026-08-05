import { z } from 'zod';

const envSchema = z.object({
  // Defaulted for local development against the Django API.
  VITE_API_BASE_URL: z.url().default('http://localhost:8000'),
  VITE_APP_NAME: z.string().default('SOAIRD App'),
  VITE_APP_VERSION: z.string().default('1.0.0'),
  VITE_SITE_URL: z.url().default('http://localhost:3000'),
  VITE_GTAG_ID: z.string().optional(),
  VITE_SENTRY_DSN: z.string().optional(),
  VITE_SENTRY_ENVIRONMENT: z.string().optional(),
  VITE_ENABLE_DEVTOOLS: z
    .string()
    .transform((v) => v === 'true')
    .optional(),
  VITE_NOINDEX: z
    .string()
    .transform((v) => v === 'true')
    .optional(),
});

export type Env = z.infer<typeof envSchema>;

function parseEnv(): Env {
  const raw = {
    VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
    VITE_APP_NAME: import.meta.env.VITE_APP_NAME,
    VITE_APP_VERSION: import.meta.env.VITE_APP_VERSION,
    VITE_SITE_URL: import.meta.env.VITE_SITE_URL,
    VITE_GTAG_ID: import.meta.env.VITE_GTAG_ID,
    VITE_SENTRY_DSN: import.meta.env.VITE_SENTRY_DSN,
    VITE_SENTRY_ENVIRONMENT: import.meta.env.VITE_SENTRY_ENVIRONMENT,
    VITE_ENABLE_DEVTOOLS: import.meta.env.VITE_ENABLE_DEVTOOLS,
    VITE_NOINDEX: import.meta.env.VITE_NOINDEX,
  };

  const result = envSchema.safeParse(raw);

  if (!result.success) {
    const formatted = result.error.issues
      .map((i) => `  ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    console.error(`[env] Invalid environment variables:\n${formatted}`);

    if (import.meta.env.DEV) {
      throw new Error(`Invalid environment variables:\n${formatted}`);
    }
  }

  return (result.success ? result.data : raw) as Env;
}

export const env = parseEnv();