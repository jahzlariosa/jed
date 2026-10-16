# New admin screen

Read `AGENTS.md` → UI, TanStack Start, Security.

1. Route: `src/routes/_authenticated/admin/<name>.tsx` with loader calling server fns.
2. UI in `src/components/admin/*-screen.tsx` using `AdminPageHeader` and admin cards.
3. Gate loaders and mutations with `requirePermission` / `requireAdmin`; never UI-only.
4. `ADMIN_ROUTE_CACHE`, `private, no-store`, `noindexHead(..., matches)`.
5. Add nav item to `admin-nav.ts` with the right permission.
