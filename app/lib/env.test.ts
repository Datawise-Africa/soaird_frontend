import { describe, it, expect } from 'vitest';
import { z } from 'zod';

// Re-define the schema here to test validation logic without import.meta.env side effects
const envSchema = z.object({
  VITE_API_BASE_URL: z.string().url(),
  VITE_APP_NAME: z.string().default('Datawise Frontend'),
  VITE_APP_VERSION: z.string().default('1.0.0'),
  VITE_GTAG_ID: z.string().optional(),
  VITE_SENTRY_DSN: z.string().optional(),
  VITE_SENTRY_ENVIRONMENT: z.string().optional(),
  VITE_ENABLE_DEVTOOLS: z
    .string()
    .transform((v) => v === 'true')
    .optional(),
});

describe('env validation schema', () => {
  it('passes with valid required env vars', () => {
    const result = envSchema.safeParse({
      VITE_API_BASE_URL: 'http://localhost:8080',
    });
    expect(result.success).toBe(true);
  });

  it('fails when VITE_API_BASE_URL is missing', () => {
    const result = envSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('fails when VITE_API_BASE_URL is not a valid URL', () => {
    const result = envSchema.safeParse({
      VITE_API_BASE_URL: 'not-a-url',
    });
    expect(result.success).toBe(false);
  });

  it('applies default values for optional fields', () => {
    const result = envSchema.parse({
      VITE_API_BASE_URL: 'http://localhost:8080',
    });
    expect(result.VITE_APP_NAME).toBe('Datawise Frontend');
    expect(result.VITE_APP_VERSION).toBe('1.0.0');
  });

  it('transforms VITE_ENABLE_DEVTOOLS to boolean', () => {
    const result = envSchema.parse({
      VITE_API_BASE_URL: 'http://localhost:8080',
      VITE_ENABLE_DEVTOOLS: 'true',
    });
    expect(result.VITE_ENABLE_DEVTOOLS).toBe(true);
  });

  it('transforms VITE_ENABLE_DEVTOOLS false string to false', () => {
    const result = envSchema.parse({
      VITE_API_BASE_URL: 'http://localhost:8080',
      VITE_ENABLE_DEVTOOLS: 'false',
    });
    expect(result.VITE_ENABLE_DEVTOOLS).toBe(false);
  });

  it('leaves optional fields undefined when not provided', () => {
    const result = envSchema.parse({
      VITE_API_BASE_URL: 'http://localhost:8080',
    });
    expect(result.VITE_GTAG_ID).toBeUndefined();
    expect(result.VITE_SENTRY_DSN).toBeUndefined();
  });
});
