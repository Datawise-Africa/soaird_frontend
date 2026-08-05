// Combining accent marks (U+0300–U+036F), left over after NFKD normalisation.
const COMBINING_MARKS = /[̀-ͯ]/g;
const NON_ALNUM = /[^a-z0-9]+/g;
const EDGE_HYPHENS = /^-+|-+$/g;

/**
 * Turn a display name into a URL-safe slug.
 *
 * `"Design & Research"` → `"design-research"`. Used so callers never hand-type
 * a slug — categories derive theirs from the name at the API boundary.
 */
export function slugify(value: string): string {
  return value
    .normalize('NFKD')
    .replace(COMBINING_MARKS, '')
    .toLowerCase()
    .trim()
    .replace(NON_ALNUM, '-')
    .replace(EDGE_HYPHENS, '');
}

/**
 * Slugify `name`, then make it unique against `taken` by appending `-2`, `-3`…
 * Falls back to `item` when a name slugifies to an empty string.
 */
export function uniqueSlug(name: string, taken: Iterable<string>): string {
  const base = slugify(name) || 'item';
  const used = new Set(taken);

  if (!used.has(base)) return base;

  let n = 2;
  while (used.has(`${base}-${n}`)) n += 1;
  return `${base}-${n}`;
}
