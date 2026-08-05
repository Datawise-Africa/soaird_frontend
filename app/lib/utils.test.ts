import { describe, it, expect } from 'vitest';
import { cn } from './utils';

describe('cn utility function', () => {
  it('merges class names correctly', () => {
    expect(cn('class1', 'class2')).toBe('class1 class2');
  });

  it('handles conditional classes', () => {
    const showClass2 = false;
    expect(cn('class1', showClass2 && 'class2', 'class3')).toBe(
      'class1 class3'
    );
  });

  it('handles undefined and null values', () => {
    expect(cn('class1', undefined, null, 'class2')).toBe('class1 class2');
  });

  it('merges tailwind classes correctly', () => {
    const result = cn('px-2', 'px-4');
    // tailwind-merge should keep only px-4
    expect(result).toBe('px-4');
  });

  it('handles empty input', () => {
    expect(cn()).toBe('');
  });

  it('handles objects with boolean values', () => {
    expect(cn({ class1: true, class2: false, class3: true })).toBe(
      'class1 class3'
    );
  });
});
