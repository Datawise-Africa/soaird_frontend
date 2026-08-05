import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

export const metricAnswerSchema = z.object({
  finding: z.enum([
    'meets',
    'partially_meets',
    'does_not_meet',
    'insufficient_evidence',
  ]),
  confidence: z.enum(['not_provided', 'low', 'medium', 'high']),
  comments: z
    .string()
    .trim()
    .max(10000, 'Comments must be 10,000 characters or fewer'),
  evidence_url: z
    .string()
    .trim()
    .refine(
      (value) => !value || /^https?:\/\//i.test(value),
      'Enter a complete http:// or https:// URL'
    ),
  evidence_file: z.unknown().optional(),
});

export const metricAnswerResolver = zodResolver(metricAnswerSchema);
export type MetricAnswerFormInput = z.infer<typeof metricAnswerSchema>;

export const metricInputSchema = z.object({
  values: z.record(z.string(), z.record(z.string(), z.string())),
});

export const metricInputResolver = zodResolver(metricInputSchema);
export type MetricInputFormInput = z.infer<typeof metricInputSchema>;

export const assessmentSourceSchema = z
  .object({
    source_type: z.enum([
      'dataset',
      'metadata',
      'documentation',
      'licence',
      'publication',
      'other',
    ]),
    source_uri: z
      .string()
      .trim()
      .refine(
        (value) => !value || /^https?:\/\//i.test(value),
        'Enter a complete http:// or https:// URL'
      ),
    source_file: z.unknown().optional(),
  })
  .refine(
    (value) => {
      const hasFile =
        typeof FileList !== 'undefined' &&
        value.source_file instanceof FileList &&
        value.source_file.length > 0;
      return hasFile || Boolean(value.source_uri);
    },
    { message: 'Choose a file or enter a source URL', path: ['source_file'] }
  );

export const assessmentSourceResolver = zodResolver(assessmentSourceSchema);
export type AssessmentSourceFormInput = z.infer<typeof assessmentSourceSchema>;