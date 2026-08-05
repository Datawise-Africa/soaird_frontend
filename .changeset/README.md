# Changesets

This folder is managed by [Changesets](https://github.com/changesets/changesets) — it owns versioning, CHANGELOG generation, and GitHub Releases for this app.

## Workflow

1. **In your PR**, add a changeset describing the change for users (not the implementation detail in the commit subject):

   ```bash
   pnpm changeset
   ```

   You'll be prompted for the bump type (`patch` / `minor` / `major`) and a short summary. A new file is written under `.changeset/<slug>.md` — commit it with your PR.

   Skip this for changes that don't ship to users (CI tweaks, internal refactors, doc-only edits).

2. **On merge to `main`**, the `release.yml` workflow runs. If there are pending `.changeset/*.md` files, it opens (or updates) a single "Version Packages" PR that:
   - Bumps the version in `package.json`
   - Rewrites `CHANGELOG.md`
   - Deletes the consumed changeset files

3. **Merging the "Version Packages" PR** triggers the same workflow to:
   - Tag the commit (`vX.Y.Z`)
   - Create a GitHub Release with the CHANGELOG entry as the body

## Bump types

| Type    | When to use                                                     |
| ------- | --------------------------------------------------------------- |
| `patch` | Bug fixes, copy edits, dependency bumps with no behavior change |
| `minor` | Backwards-compatible new features                               |
| `major` | Breaking changes — also describe the migration in the changeset |

## CLI reference

| Command                  | What it does                                                  |
| ------------------------ | ------------------------------------------------------------- |
| `pnpm changeset`         | Interactive prompt — write a new changeset file               |
| `pnpm changeset status`  | Show pending changesets and the version they'd produce        |
| `pnpm changeset version` | Consume pending changesets locally (the CI does this for you) |

You generally won't run `version` manually — the workflow handles it.
