import { describe, expect, it } from 'vitest';
import { datasetRegistrationSchema } from './dataset.schema';

describe('datasetRegistrationSchema', () => {
  it('requires a non-blank dataset name', () => {
    const result = datasetRegistrationSchema.safeParse({
      name: '   ',
      source_url: '',
    });
    expect(result.success).toBe(false);
  });

  it('accepts the backend-supported registration fields', () => {
    const result = datasetRegistrationSchema.safeParse({
      name: 'Kenya Agricultural Research Dataset 2026',
      domain: 'Agriculture',
      country: 'Kenya',
      region: 'East Africa',
      geographic_scope: 'National',
      modality: 'Tabular',
      hosting_platform: 'Kaggle',
      accessibility: 'Public download',
      metadata_available: 'yes',
      source_url: 'https://example.org/datasets/agriculture',
      licence: 'CC BY 4.0',
      owner: 'SOAIRD Test Researcher',
      contact: 'researcher@example.org',
      intended_use_case: 'Research validation',
      challenges_notes: '',
    });
    expect(result.success).toBe(true);
  });

  it('rejects an incomplete source URL', () => {
    const result = datasetRegistrationSchema.safeParse({
      name: 'Dataset',
      source_url: 'example.org/dataset',
    });
    expect(result.success).toBe(false);
  });
});