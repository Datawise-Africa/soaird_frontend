# Release Guide

This project uses [Changesets](https://github.com/changesets/changesets) to manage versions, the `CHANGELOG.md`, and GitHub Releases. The automation lives in `.github/workflows/release.yml`; the bookkeeping lives in `.changeset/`.

You should rarely need to edit `package.json` or `CHANGELOG.md` by hand — Changesets owns both.

---

## TL;DR — what every contributor needs to know

When your PR includes a change that ships to users, add a changeset:

```bash
pnpm changeset
```

Pick `patch` / `minor` / `major`, write a short user-facing summary, commit the generated `.changeset/<slug>.md` file with your PR. Done.

When the PR merges to `main`, a bot opens a "Version Packages" PR. Merging that PR cuts a release.

---

## The full flow

```
┌──────────────────────┐
│  Feature/fix PR      │   contributor runs `pnpm changeset`,
│                      │   commits .changeset/*.md alongside code
└──────────┬───────────┘
           │ merge to main
           ▼
┌──────────────────────────────────┐
│ .github/workflows/release.yml    │   runs on push to main
│ → changesets/action@v1           │
└──────────┬───────────────────────┘
           │
           ├── If there are pending changesets:
           │     opens (or updates) a "Version Packages" PR that
           │     • bumps package.json
           │     • rewrites CHANGELOG.md
           │     • deletes consumed .changeset/*.md files
           │
           ▼ merge the Version Packages PR
┌──────────────────────────────────┐
│ Same workflow re-runs on main    │
│ → tags vX.Y.Z                    │
│ → creates a GitHub Release with  │
│   the CHANGELOG entry as body    │
│ → posts to Slack                 │
└──────────────────────────────────┘
```

The workflow is **idempotent**. If you push more commits to `main` after the Version Packages PR is open, the bot updates that same PR rather than opening another.

---

## Picking a bump type

| Bump    | Use for                                                         | Example                             |
| ------- | --------------------------------------------------------------- | ----------------------------------- |
| `patch` | Bug fixes, copy edits, dependency bumps with no behavior change | `fix: bookmark icon stuck on hover` |
| `minor` | Backwards-compatible new features                               | `feat: product preview modal`       |
| `major` | Breaking changes                                                | `feat!: drop /api/v1 routes`        |

For `major`, include migration notes in the changeset body — that text ends up in `CHANGELOG.md` and the GitHub Release, so make it user-readable.

When in doubt, choose the smaller bump. We can always cut `1.5.0` next month — we can't un-major a `2.0.0` once it's tagged.

---

## When **not** to add a changeset

Some PRs don't ship to users. Skip the changeset for:

- CI / workflow tweaks
- Internal refactors with zero observable behavior change
- Doc-only edits (`*.md` files outside the codebase)
- Test-only changes
- Dependency updates that are purely DX (e.g. `prettier`, `eslint` config)

If you're unsure, add one anyway — an extra patch line in the CHANGELOG is cheaper than silently shipping a change.

---

## CLI cheatsheet

| Command                  | What it does                                                              |
| ------------------------ | ------------------------------------------------------------------------- |
| `pnpm changeset`         | Interactive prompt — write a new changeset file                           |
| `pnpm changeset:status`  | Show pending changesets and the next version they'd produce               |
| `pnpm changeset:version` | Consume pending changesets locally (CI does this for you — rarely needed) |

The release workflow runs `pnpm changeset:version` to produce the Version Packages PR, and `pnpm exec changeset tag` to create the git tag on publish.

---

## Writing a good changeset

The summary you type into `pnpm changeset` lands verbatim in `CHANGELOG.md` and the GitHub Release. Write it for **users of the app**, not future-you reading git blame.

**Bad** (describes implementation):

> Refactor the bookmark hook to use `useEffectEvent`

**Good** (describes effect):

> Bookmarks now resume automatically after sign-in — clicking the bookmark button while signed out queues the action and runs it once you've authenticated.

Stack changes for one PR into one changeset; don't write one file per commit.

---

## Edge cases

### "I forgot to add a changeset"

Push another commit to the PR that adds it (`pnpm changeset` → commit). The bot picks it up on the next `main` push.

### "I added the wrong bump type"

Edit the `.changeset/<slug>.md` file directly — the first frontmatter block (`"frontend-ui-svc": patch`) controls the bump.

### "I want to release right now without merging more work"

Just merge the open Version Packages PR. If there isn't one, you have no pending changes to release.

### "I need to skip a release"

Don't add changesets to your PRs. With no pending changesets, the workflow no-ops and no PR is opened.

### "I need to roll back a release"

Releases are cut from `main`. Revert the offending commit on `main` (`git revert <sha>` via a PR), then add a `patch` changeset noting the rollback. Avoid `git reset --hard` / force-push on `main` — that orphans the tag.

---

## Configuration

- `.changeset/config.json` — Changesets behavior (base branch, changelog adapter, etc.).
- `.changeset/README.md` — quick reference shown to anyone browsing the folder.
- `.github/workflows/release.yml` — the automation. Runs on push to `main`, uses `changesets/action@v1`, posts a Slack notification when a release is published.

The changelog adapter is `@changesets/changelog-github` configured against `Datawise-Africa/frontend-ui-svc`, so entries automatically link to PRs and commits.
