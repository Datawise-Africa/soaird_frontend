import { describe, expect, it } from 'vitest';
import {
  assessmentSourceSchema,
  informationUnavailableSchema,
  metricAnswerSchema,
  metricInputSchema,
} from './questionnaire.schema';

describe('metric answer schema', () => {
  it('accepts a draft answer without evidence', () => {
    expect(
      metricAnswerSchema.safeParse({
        finding: 'insufficient_evidence',
        confidence: 'not_provided',
        comments: '',
        evidence_url: '',
      }).success
    ).toBe(true);
  });

  it('rejects unsafe or incomplete evidence URLs', () => {
    expect(
      metricAnswerSchema.safeParse({
        finding: 'meets',
        confidence: 'high',
        comments: '',
        evidence_url: 'example.com/file',
      }).success
    ).toBe(false);
  });
});

describe('metric input schema', () => {
  it('accepts structured target context keyed by framework input', () => {
    expect(
      metricInputSchema.safeParse({
        values: {
          target_definition: {
            intended_task: 'regression',
            target_field: 'Biomass',
            target_description: 'Above-ground biomass',
          },
        },
      }).success
    ).toBe(true);
  });

  it('rejects unstructured scalar input values', () => {
    expect(
      metricInputSchema.safeParse({
        values: { target_definition: 'Biomass' },
      }).success
    ).toBe(false);
  });
});

describe('assessment source schema', () => {
  it('accepts a safe public source URL', () => {
    expect(
      assessmentSourceSchema.safeParse({
        source_type: 'documentation',
        source_uri: 'https://example.org/dataset-card',
      }).success
    ).toBe(true);
  });

  it('accepts controlled URL import and expanded evidence categories', () => {
    expect(
      assessmentSourceSchema.safeParse({
        source_type: 'consent_privacy',
        ingestion_mode: 'import_url',
        source_uri: 'https://example.org/consent.pdf',
      }).success
    ).toBe(true);
  });

  it('requires a file or safe URL', () => {
    expect(
      assessmentSourceSchema.safeParse({
        source_type: 'dataset',
        source_uri: '',
      }).success
    ).toBe(false);
    expect(
      assessmentSourceSchema.safeParse({
        source_type: 'dataset',
        source_uri: 'file:///private/data.csv',
      }).success
    ).toBe(false);
  });
});

describe('information unavailable schema', () => {
  it('requires a meaningful auditable reason', () => {
    expect(
      informationUnavailableSchema.safeParse({ reason: 'Unknown' }).success
    ).toBe(false);
    expect(
      informationUnavailableSchema.safeParse({
        reason:
          'The dataset publisher did not release the collection instrument.',
      }).success
    ).toBe(true);
  });
});