# SOAIRD App

The researcher frontend for the **State of AI-Ready Data in Africa
(SOAI-RD)**. It provides a secure workspace for the dataset registry,
assessment execution, evidence-centred review, research analytics, framework
governance and audit history.

This codebase is built on the Datawise `frontend-ui-svc` template and uses its
React Router SSR architecture, authentication persistence, API client,
feature-based organization, form system, quality checks and deployment
scaffolding.

## Technology

- React 19 and React Router 7 with SSR
- TypeScript in strict mode
- Vite 7
- Tailwind CSS 4, shadcn/ui and Radix UI
- Redux Toolkit and redux-persist
- TanStack Query
- React Hook Form and Zod
- Axios
- Vitest and Testing Library
- pnpm 9, Node.js 20+

## Application routes

| Route | Purpose |
| --- | --- |
| `/` | Sends authenticated users to the overview and others to sign in |
| `/auth/login` | Researcher sign in |
| `/auth/register` | Account registration and verification hand-off |
| `/overview` | Research dashboard and readiness summary |
| `/datasets` | Dataset registry, search and record drawer |
| `/assessments` | Assessment progress, execution and reports |
| `/reviews` | Evidence-centred independent review workspace |
| `/reports` | Cohort analytics and research outputs |
| `/governance` | Framework versions, proposals and audit history |
| `/workspace` | Personal/organization context, invitations and members |
| `/invitations?token=…` | Secure invitation-link acceptance |

All workspace routes are protected by the dashboard layout loader. Unauthenticated
requests are redirected before the protected page is rendered.

## Workspace model

Every account has a private Personal workspace and can belong to multiple
organization workspaces. The selector in the application header changes the
dataset, assessment, overview and reporting scope. Organization access is
invitation-only:

1. A workspace administrator invites an email address and chooses an initial role.
2. The invitation is single-use and expires according to the backend setting.
3. The invited user signs in with the matching email and accepts or declines.
4. Acceptance activates membership and adds the workspace to the selector.
5. Administrators can change roles, resend or revoke pending invitations, and
   remove members. The final administrator cannot be removed.

## Local setup

Requirements:

- Node.js 20 or newer
- pnpm 9 or newer
- The SOAI-RD Django backend running locally

```bash
cp .env.example .env
pnpm install
pnpm dev
```

The frontend runs at `http://localhost:3000` and defaults to a backend at
`http://localhost:8000`.

## Environment variables

```env
VITE_API_BASE_URL=http://localhost:8000
VITE_APP_NAME=SOAIRD App
VITE_APP_VERSION=0.2.0
VITE_SITE_URL=http://localhost:3000
```

Optional variables for analytics, error monitoring, devtools and search
indexing are documented in `.env.example`.

`VITE_API_BASE_URL` must be the backend origin without `/api/v1`. Endpoint
paths are added by the frontend API modules.

## Backend browser configuration

For local frontend/backend integration, the Django backend should allow the
frontend origin and credentialed requests:

```python
CORS_ALLOWED_ORIGINS = ["http://localhost:3000"]
CORS_ALLOW_CREDENTIALS = True
CSRF_TRUSTED_ORIGINS = ["http://localhost:3000"]
```

Production cookie settings should use HTTPS. The refresh token remains in the
backend-managed cookie; the short-lived access token is attached to API calls.
When an API call receives `401`, the client performs one shared refresh request,
updates the session and retries the original request. A failed refresh clears
the local session and returns the user to sign in.

## API organization

- `app/lib/api/client.ts` configures Axios, credentials, bearer tokens and
  refresh/retry behavior.
- `app/lib/api/soaird-client.ts` contains SOAI-RD endpoint paths and response
  contracts.
- `app/features/auth/` contains login, registration, session and logout
  mutations/queries.
- `app/features/research/` contains the dashboard and research workspaces.

The central SOAI-RD client currently expects these endpoint families:

```text
/api/v1/auth/
/api/v1/datasets/
/api/v1/assessments/
/api/v1/reviews/
/api/v1/reporting/
/api/v1/framework/
/api/v1/audit/
```

If a backend router uses a different path, update it once in
`app/lib/api/soaird-client.ts`.

## Quality commands

```bash
pnpm typecheck
pnpm lint
pnpm test:run
pnpm build
```

The production build creates:

- `build/client` for browser assets
- `build/server` for the React Router SSR server

Run it locally with:

```bash
pnpm start
```

## Main structure

```text
app/
├── components/
│   ├── dashboard/
│   ├── form-fields/
│   ├── forms/
│   └── ui/
├── features/
│   ├── auth/
│   └── research/
├── lib/
│   ├── api/
│   ├── auth/
│   ├── providers/
│   ├── schema/
│   └── utils/
├── routes/
├── store/
├── app.css
├── research.css
├── research.routes.ts
├── root.tsx
└── routes.ts
```

## Authentication behavior

1. Registration creates an account and shows the backend verification
   requirement.
2. Login stores the returned short-lived access token and user identity.
3. The persisted session is readable during SSR, preventing an authentication
   flash on protected routes.
4. The refresh token is sent through `withCredentials`.
5. The account dropdown provides a working sign-out action.
6. Logout clears client state even if the backend logout request fails.

## Notes for continued implementation

The migrated screens preserve the existing SOAI-RD research experience. Some
buttons that were placeholders in the supplied frontend remain presentation
actions until their create/edit backend workflows are implemented. New forms
should follow the template conventions: React Hook Form, Zod schemas and the
reusable components in `app/components/form-fields`.