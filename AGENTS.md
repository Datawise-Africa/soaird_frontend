# SOAIRD App conventions

## Stack

- React 19, React Router 7 SSR and Vite
- TypeScript strict mode
- Tailwind CSS 4, shadcn/ui and Radix UI
- Redux Toolkit for client-global state
- TanStack Query for server state
- React Hook Form and Zod for forms
- Axios for backend communication
- Vitest for tests

## Commands

```bash
pnpm dev
pnpm typecheck
pnpm lint
pnpm test:run
pnpm build
```

## Architecture

- Routes are flat modules in `app/routes/`.
- Workspace routes are declared in `app/research.routes.ts`.
- The protected shell and SSR guard live in
  `app/components/dashboard-layout.tsx`.
- Authentication state and mutations live in `app/features/auth/`.
- Research presentation and behavior live in `app/features/research/`.
- Axios configuration and refresh/retry behavior live in
  `app/lib/api/client.ts`.
- SOAI-RD endpoint contracts live in `app/lib/api/soaird-client.ts`.

## Required patterns

- Use `~/` for app-relative imports.
- Use `useAuth()` to render authentication state.
- Use TanStack Query for new server-state workflows.
- Put Zod schemas and their resolvers in `app/lib/schema/`.
- Use React Hook Form for form state.
- Use the reusable fields in `app/components/form-fields/`.
- Wrap component props in `Readonly<>`.
- Use `cn()` from `~/lib/utils` for conditional class names.
- Keep browser globals guarded for SSR.
- Use route loaders and server-side redirects for protected pages.
- Do not add endpoint strings throughout components; add them to the central
  SOAI-RD API client.

## Authentication contract

- Login returns `access`, optional `access_expires_in`, and `user`.
- Refresh is cookie-based and returns a new `access` value.
- Requests use `withCredentials`.
- A single refresh request is shared when concurrent calls receive `401`.
- Logout is best-effort but always clears local authentication state.

## Forms

Every form must use:

1. A Zod schema in `app/lib/schema/`.
2. A resolver exported next to that schema.
3. `useForm`.
4. Reusable form-field components.
5. A TanStack Query mutation for backend writes.

Use `Dialog`, `Sheet` and `useConfirm()` from the existing UI layer instead of
browser-native confirmation or unstyled overlays.

## Quality

Before hand-off, run type checking, linting, the test suite and a production
build. New backend workflows should add contract or component tests alongside
their feature modules.