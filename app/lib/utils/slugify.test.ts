import { describe, expect, it } from 'vitest';
import { slugify, uniqueSlug } from './slugify';

describe('slugify', () => {
  it('lowercases and hyphenates', () => {
    expect(slugify('Design Research')).toBe('design-research');
  });

  it('collapses non-alphanumerics and symbols to single hyphens', () => {
    expect(slugify('Design & Research!!')).toBe('design-research');
  });

  it('trims leading and trailing separators', () => {
    expect(slugify('  Hello World  ')).toBe('hello-world');
    expect(slugify('--edge--')).toBe('edge');
  });

  it('strips accents', () => {
    expect(slugify('Café Déjà')).toBe('cafe-deja');
  });

  it('returns empty string for symbol-only input', () => {
    expect(slugify('!!!')).toBe('');
  });
});

describe('uniqueSlug', () => {
  it('returns the base slug when free', () => {
    expect(uniqueSlug('Engineering', [])).toBe('engineering');
  });

  it('appends a numeric suffix when taken', () => {
    expect(uniqueSlug('Engineering', ['engineering'])).toBe('engineering-2');
    expect(uniqueSlug('Engineering', ['engineering', 'engineering-2'])).toBe(
      'engineering-3'
    );
  });

  it('falls back to "item" for an empty slug', () => {
    expect(uniqueSlug('!!!', [])).toBe('item');
    expect(uniqueSlug('!!!', ['item'])).toBe('item-2');
  });
});
