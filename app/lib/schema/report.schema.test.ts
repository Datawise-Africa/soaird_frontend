import { cohortFiltersSchema, EMPTY_COHORT_FILTERS } from './report.schema';

describe('cohort filters', () => {
  it('accepts an unrestricted final-only cohort', () => {
    expect(cohortFiltersSchema.safeParse(EMPTY_COHORT_FILTERS).success).toBe(
      true
    );
  });
  it('rejects a reversed date range', () => {
    expect(
      cohortFiltersSchema.safeParse({
        ...EMPTY_COHORT_FILTERS,
        completed_from: '2026-09-21',
        completed_to: '2026-09-01',
      }).success
    ).toBe(false);
  });
});
