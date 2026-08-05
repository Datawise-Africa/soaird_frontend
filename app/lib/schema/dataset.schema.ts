import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const optionalText = (maximum: number) =>
  z.string().trim().max(maximum).optional().or(z.literal(''));

export const datasetRegistrationSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Dataset name is required')
    .max(500, 'Dataset name must be 500 characters or fewer'),
  domain: optionalText(255),
  country: optionalText(255),
  region: optionalText(255),
  geographic_scope: optionalText(255),
  modality: optionalText(255),
  hosting_platform: optionalText(255),
  accessibility: optionalText(255),
  metadata_available: z.enum(['', 'yes', 'no', 'unknown']).optional(),
  source_url: z
    .string()
    .trim()
    .refine(
      (value) => !value || z.url().safeParse(value).success,
      'Enter a complete URL such as https://example.org/dataset'
    ),
  licence: optionalText(255),
  owner: optionalText(500),
  contact: optionalText(500),
  intended_use_case: z.string().trim().optional(),
  challenges_notes: z.string().trim().optional(),
});

export const datasetRegistrationResolver = zodResolver(
  datasetRegistrationSchema
);

export type DatasetRegistrationInput = z.infer<
  typeof datasetRegistrationSchema
>;

export const datasetImportSchema = z.object({
  file: z.custom<File>(
    (value) => typeof File !== 'undefined' && value instanceof File,
    'Choose a CSV, XLSX or XLSM tracker file'
  ),
  sheet_name: z.string().trim().min(1, 'Worksheet name is required').max(255),
});

export const datasetImportResolver = zodResolver(datasetImportSchema);
export type DatasetImportInput = z.infer<typeof datasetImportSchema>;