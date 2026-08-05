import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

export const assessmentDraftSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Assessment title is required')
    .max(255, 'Assessment title must be 255 characters or fewer'),
  framework_version: z.string().uuid('Select an active framework version'),
  scope_notes: z
    .string()
    .trim()
    .max(5000, 'Scope notes must be 5,000 characters or fewer')
    .optional()
    .or(z.literal('')),
});

export const assessmentDraftResolver = zodResolver(assessmentDraftSchema);
export type AssessmentDraftFormInput = z.infer<typeof assessmentDraftSchema>;