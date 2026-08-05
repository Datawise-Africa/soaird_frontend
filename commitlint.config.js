/**
 * Example commits accepted by this config:
 *
 *   Conventional commits:
 *     feat(products): add product image gallery
 *     fix(auth): resolve token refresh loop
 *     docs: update API client usage in README
 *     refactor(store): simplify auth slice logic
 *     perf(queries): reduce product list re-renders
 *     chore: update eslint config
 *     feat(api)!: change pagination response format
 *
 *   Jira-ticket commits (ENG project):
 *     ENG-123: add product image gallery
 *     ENG-42 fix token refresh loop
 *     ENG-7: update eslint config
 *
 * Rejected examples:
 *     Added new feature                       (no type / no ticket)
 *     ENG-: missing number                    (ticket id required)
 *     feat: subject ending with a period.     (subject-full-stop)
 *     <any header longer than 72 characters>  (header-max-length)
 */

const TYPES = [
  'feat',
  'fix',
  'docs',
  'style',
  'refactor',
  'test',
  'chore',
  'perf',
  'ci',
  'revert',
];

const CONVENTIONAL_RE = new RegExp(
  `^(${TYPES.join('|')})(?:\\([\\w$.\\-* ]+\\))?!?: .+$`
);
const JIRA_RE = /^ENG-\d+[:\s]\s*.+$/;

/** @type {import('@commitlint/types').UserConfig} */
export default {
  plugins: [
    {
      rules: {
        'header-format': ({ header }) => {
          if (!header) return [false, 'commit header must not be empty'];
          if (CONVENTIONAL_RE.test(header) || JIRA_RE.test(header)) {
            return [true];
          }
          return [
            false,
            `header must be a conventional commit (${TYPES.join('|')}) or start with "ENG-<number>: <subject>"`,
          ];
        },
      },
    },
  ],
  rules: {
    // Header must match either a conventional commit or an ENG-<number> Jira ticket.
    'header-format': [2, 'always'],
    // Length is enforced for BOTH formats.
    'header-max-length': [2, 'always', 72],
    // No period at end of subject
    'subject-full-stop': [2, 'never', '.'],
  },
};
