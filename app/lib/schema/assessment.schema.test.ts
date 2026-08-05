import { describe, expect, it } from 'vitest';
import { assessmentDraftSchema } from './assessment.schema';

const valid = {
  title: 'Sesame dataset – Initial AI Readiness Assessment',
  framework_version: '8c2fc1fc-793a-4f5e-b0c0-89e8f55084aa',
  scope_notes: '',
};

describe('assessment draft schema', () => {
  it('accepts a valid draft setup', () => {
    expect(assessmentDraftSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects a blank title', () => {
    expect(
      assessmentDraftSchema.safeParse({ ...valid, title: '   ' }).success
    ).toBe(false);
  });

  it('rejects a malformed framework identifier', () => {
    expect(
      assessmentDraftSchema.safeParse({ ...valid, framework_version: 'active' })
        .success
    ).toBe(false);
  });
});