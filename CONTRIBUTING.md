# Contributing to Datawise Frontend UI Service

This guide covers the conventions and workflows for contributing to the Datawise Frontend UI Service. All team members should follow these standards to keep the codebase consistent and maintainable.

---

## Getting Started

1. **Clone the repository**:
   ```bash
   git clone git@github.com:datawise-africa/frontend-ui-svc.git
   cd frontend-ui-svc
   ```
2. **Install dependencies** (requires pnpm v9+ and Node >= 20):
   ```bash
   pnpm install
   ```
3. **Set up environment**: Copy `.env.example` to `.env` and fill in `VITE_API_BASE_URL`
4. **Create a branch** from `main` for your changes:
   ```bash
   git checkout -b feat/your-feature-name
   ```

---

## Development Workflow

### Running the Dev Server

```bash
pnpm dev
```

### Code Quality — Run After Every Change

```bash
pnpm lint:fix && pnpm format
```

### Type Checking

```bash
pnpm typecheck              # Runs typegen + tsc
```

### Running Tests

```bash
pnpm test                   # Watch mode
pnpm test:run               # Single run
pnpm test:ui                # With UI
pnpm test:coverage          # With coverage report
```

### Building for Production

```bash
pnpm build
```

---

## Security Practices

- **Never commit secrets**: Do not commit `.env` files, API keys, tokens, or credentials
- **Environment variables**: All sensitive config goes in `.env` (gitignored). Use `.env.example` as the template with placeholder values only
- **Dependencies**: Review new dependencies before adding them. Avoid packages with known vulnerabilities
- **Auth tokens**: Never log or expose auth tokens in client-side code or console output

---

## Commit Message Format

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification.

### Structure

```
<type>(<scope>): <subject>

<body> (optional)

<footer> (optional)
```

### Types

| Type       | Description                                     | Example                                         |
| ---------- | ----------------------------------------------- | ----------------------------------------------- |
| `feat`     | New feature                                     | `feat(products): add product image gallery`     |
| `fix`      | Bug fix                                         | `fix(auth): resolve token refresh loop`         |
| `docs`     | Documentation only                              | `docs: update API client usage in README`       |
| `style`    | Formatting, missing semicolons (no code change) | `style: fix indentation in dashboard layout`    |
| `refactor` | Code change that neither fixes nor adds         | `refactor(store): simplify auth slice logic`    |
| `test`     | Adding or updating tests                        | `test(categories): add mutation hook tests`     |
| `chore`    | Build, tooling, CI, dependencies                | `chore: update eslint config`                   |
| `perf`     | Performance improvement                         | `perf(queries): reduce product list re-renders` |
| `ci`       | CI/CD configuration                             | `ci: add preview deploy workflow`               |
| `revert`   | Revert a previous commit                        | `revert: revert feat(products) commit abc1234`  |

### Scopes

Use the feature or area being changed:

| Scope        | Area                                                     |
| ------------ | -------------------------------------------------------- |
| `products`   | Product feature (queries, mutations, routes, components) |
| `categories` | Category feature                                         |
| `auth`       | Authentication (login, store slices)                     |
| `ui`         | Shared UI components (`components/ui/`)                  |
| `forms`      | Form fields, schemas, validation                         |
| `store`      | Redux store, slices                                      |
| `api`        | API client, interceptors                                 |
| `routes`     | Route definitions, layouts                               |
| `config`     | Vite, env, build configuration                           |
| `theme`      | Theme editor, CSS variables                              |

Scope is optional but encouraged. Omit it for cross-cutting changes.

### Rules

- **Subject**: Lowercase, imperative mood, no period at the end, max 72 characters
  - Good: `feat(products): add draft saving support`
  - Bad: `feat(products): Added draft saving support.`
- **Body**: Explain _what_ and _why_, not _how_. Wrap at 72 characters.
- **Footer**: Reference internal tickets where applicable
- **Breaking changes**: Add `BREAKING CHANGE:` in the footer or `!` after the type:

  ```
  feat(api)!: change pagination response format

  BREAKING CHANGE: PaginatedResponse now uses `items` instead of `data`
  ```

### Examples

```
feat(categories): add category color picker to create dialog

Added a color input field to the create category dialog that allows
users to assign a display color. The color is stored as a hex value
and shown as a badge in the categories table.
```

```
fix(auth): prevent redirect loop on expired token

The 401 interceptor was clearing auth state and redirecting to /login
even when already on the login page, causing an infinite loop.
```

```
chore: update TanStack Query to v5.62
```

---

## Branch Naming

Use the format: `<type>/<short-description>`

```
feat/product-image-gallery
fix/auth-redirect-loop
chore/update-dependencies
refactor/simplify-filter-slice
docs/update-contributing-guide
```

---

## Pull Request Process

1. **Run checks before pushing**:
   ```bash
   pnpm lint:fix && pnpm format && pnpm typecheck
   ```
2. **Keep PRs focused** — one feature or fix per PR
3. **Write a clear PR description** with:
   - Summary of changes (bullet points)
   - Test plan (how to verify)
   - Screenshots for UI changes
4. **Reference related internal tickets** in the PR description

### PR Title

Follow the same commit message format for the PR title:

```
feat(products): add product image gallery
fix(auth): resolve token refresh loop
```

### PR Checklist

- [ ] Branch is up to date with `main`
- [ ] `pnpm lint:fix && pnpm format` passes
- [ ] `pnpm typecheck` passes
- [ ] Tests added/updated and passing
- [ ] No new warnings or errors
- [ ] Self-review completed
- [ ] No secrets or credentials in the code

### Code Review

- All PRs require at least one approval before merging
- Reviewers should check for correctness, readability, and adherence to project conventions
- Address all review comments before merging — resolve or discuss, don't ignore
- Use "Request Changes" for blocking issues, "Comment" for suggestions

---

## Git Hooks

This project uses **Husky** with two hooks:

### `pre-commit` — Lint & Format

Runs **lint-staged** on staged files:

- ESLint with `--fix`
- Prettier formatting

### `commit-msg` — Commit Message Lint

Runs **commitlint** to enforce [Conventional Commits](https://www.conventionalcommits.org/) format. Rejects commits that don't match `<type>(<scope>): <subject>`.

**Valid:**

```
feat(products): add product image gallery
fix(auth): resolve token refresh loop
chore: update dependencies
```

**Rejected:**

```
added gallery              # missing type
Feat(products): Add stuff  # uppercase type and subject
feat(products).            # period at end
```

If a hook fails, fix the reported issues before committing. Do not bypass with `--no-verify`.

---

## Environments

| Environment | Branch | Notes             |
| ----------- | ------ | ----------------- |
| Development | `dev`  | Local dev server  |
| Production  | `main` | Production deploy |

- Do not push directly to `main` — always use PRs
- Test your changes locally before opening a PR

---

## Releases

This project uses **[Changesets](https://github.com/changesets/changesets)** to manage versions, `CHANGELOG.md`, and GitHub Releases. The flow is fully documented in [`RELEASE.md`](./RELEASE.md) — read that for edge cases, but here's what every PR author needs to do:

### 1. Add a changeset to your PR

If your change ships to users (a new feature, a bug fix, copy change, perf win, breaking change), run:

```bash
pnpm changeset
```

Pick the bump type (`patch` / `minor` / `major`), write a short user-facing summary, and commit the generated `.changeset/<slug>.md` alongside your code.

**Skip the changeset** for CI tweaks, internal refactors with no observable behavior change, doc-only edits, or test-only changes. When in doubt, add one anyway.

### 2. On merge to `main`

The `release.yml` workflow opens (or updates) a "Version Packages" PR that bumps `package.json`, rewrites `CHANGELOG.md`, and deletes the consumed changeset files. You don't need to touch any of those — Changesets owns them.

### 3. Merge the Version Packages PR

That triggers the workflow to:

- Tag the commit `vX.Y.Z`
- Create a GitHub Release with the CHANGELOG entry as the body
- Post a notification to Slack (`#releases`)

### Picking a bump type

| Bump    | Use for                                                         |
| ------- | --------------------------------------------------------------- |
| `patch` | Bug fixes, copy edits, dependency bumps with no behavior change |
| `minor` | Backwards-compatible new features                               |
| `major` | Breaking changes — include migration notes in the summary       |

### Writing the summary

The text you type ends up verbatim in `CHANGELOG.md` and the GitHub Release. Write it for **users of the app**, not for someone reading the commit. Describe the effect, not the implementation:

- **Bad:** `Refactor the bookmark hook to use useEffectEvent`
- **Good:** `Bookmarks now resume automatically after sign-in.`

### CLI cheatsheet

| Command                  | What it does                                                      |
| ------------------------ | ----------------------------------------------------------------- |
| `pnpm changeset`         | Interactive prompt — write a new changeset file                   |
| `pnpm changeset:status`  | Show pending changesets and the version they'd produce            |
| `pnpm changeset:version` | Consume pending changesets locally (CI does this — rarely needed) |

---

## Questions?

If you have questions about contributing, consult with the team directly.
