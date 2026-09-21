import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

export const cohortFiltersSchema = z
  .object({
    country: z.string().trim().max(255),
    region: z.string().trim().max(255),
    domain: z.string().trim().max(255),
    modality: z.string().trim().max(255),
    framework_version: z.string().trim().max(255),
    completed_from: z.string(),
    completed_to: z.string(),
    group_by: z.enum(['domain', 'country', 'region', 'modality']),
    include_provisional: z.enum(['false', 'true']),
  })
  .refine(
    (value) =>
      !value.completed_from ||
      !value.completed_to ||
      value.completed_from <= value.completed_to,
    {
      path: ['completed_to'],
      message: 'End date must be on or after the start date.',
    }
  );
export const cohortFiltersResolver = zodResolver(cohortFiltersSchema);
export type CohortFilters = z.infer<typeof cohortFiltersSchema>;
export const EMPTY_COHORT_FILTERS: CohortFilters = {
  country: '',
  region: '',
  domain: '',
  modality: '',
  framework_version: '',
  completed_from: '',
  completed_to: '',
  group_by: 'domain',
  include_provisional: 'false',
};
