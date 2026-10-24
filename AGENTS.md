# Agent instructions

This file is the **canonical** project spec for every coding agent (Cursor, Claude Code, Codex, Gemini CLI, Copilot, Windsurf, Zed, and others). Tool-specific files only **index** this document — they must not fork policy.

| Tool | How it loads this |
|---|---|
| Codex, Cursor, many others | `AGENTS.md` at repo root |
| Claude Code | `CLAUDE.md` → `@AGENTS.md` |
| Gemini CLI | `GEMINI.md` → `@AGENTS.md` |
| GitHub Copilot | `.github/copilot-instructions.md` |
| Cursor globs | `.cursor/rules/*.mdc` (pointers + attach scope only) |

If this file and a tool adapter disagree, **this file wins**. Edit policy here first, then keep adapters as one-liners.

Do not invent Next.js, Remix, or Expo APIs. Do not commit unless asked. Keep diffs small. Verify UI in the browser (or the closest substitute).

**Priorities (every change):** treat **caching**, **memory**, and **security** as required work, not polish. Do not ship a route, server fn, form, or subscription until all three pass. Fast public pages stay cached; session/tenant bytes never do. No leaks. Fail closed. See **Security**, **Memory**, and **Caching** below.

**Routine:** after any durable product change (route, table, permission, env, auth seam, UI kit), update **this file** in the same task. Do not copy the new facts into `CLAUDE.md`, `GEMINI.md`, Copilot instructions, or `.cursor/rules/*.mdc` — those stay one-line indexes. A later agent should be able to catch up from this document plus the code.

## Commands

```bash
npm install
cp .env.example .env.local   # fill in Supabase values; see README
npm run dev          # Vite, port 3000 (needs Node 22+)
npm run generate-routes
npm run typecheck    # tsc --noEmit (CI runs this)
npm run build
npm run preview
npm run check        # Biome lint + format check (CI runs `biome ci .`); npm run format to fix
npm test             # Vitest (vitest run); npm run test:watch to iterate
```

CI (`.github/workflows/ci.yml`) runs `npm ci`, Biome (`biome ci .`), `typecheck`, `npm test` (when defined), `build`, and `npm audit --omit=dev --audit-level=high` on every PR and on `main`. Node is pinned by `.nvmrc` (22) and `engines`. Keep `shadcn` (CLI) in `devDependencies` so the production audit stays clean.

Unit tests live next to the code as `src/**/*.test.ts` (Vitest, `vitest.config.ts` kept separate from the app Vite config). Security-critical pure helpers (`safeInternalPath`, `#/auth/validators`, `isPermission`) must keep their tests; add a case when you change their rules.

## Stack

- **TanStack Start** (Vite + React 19) — not Next.js. No `next/*`, no `"use client"` / `"use server"`, no `getServerSideProps`, no App Router files.
- File routes: `src/routes`. Never edit `src/routeTree.gen.ts`.
- Imports: `#/*` → `src/*` (prefer `#/`). `@/*` is also mapped.
- Tailwind CSS v4 (`src/styles.css`). **Primary UI kit: [shadcn/ui](https://ui.shadcn.com) only** — not Chakra, MUI, or Mantine.
- **Supabase** Postgres + **Supabase Auth** (`@supabase/supabase-js` + `@supabase/ssr`; browser/server clients in `#/lib/supabase`).
- Auth today: Supabase Auth. Keep a swap path to Better Auth via `#/auth` (do not install Better Auth until migrating).
- RSC (`tanstackStart({ rsc: { enabled: true } })`) is **off** unless we explicitly enable it.
- **Deploy target: Vercel.** `vercel.json` pins `regions: ["hnd1"]` (Tokyo), aligned with hosted Supabase **ap-northeast-1**. `vite.config.ts` uses the Nitro Vite plugin with `preset: 'vercel'` (`nitro` is pinned exactly: it is a beta). `npm run build` emits the Vercel Build Output API under `.vercel/output` (gitignored); `vite dev` is unaffected. `createServerFn(...).validator()` is the current API (`inputValidator` is the deprecated alias). `npm run verify:bundle` asserts the server output excludes jsdom / `@blocknote/server-util`.
- Dependency policy: TanStack and Supabase packages use caret ranges that match the lockfile (no `latest`); `.github/dependabot.yml` groups `@tanstack/*` and `@supabase/*` weekly. Devtools packages and the `shadcn` CLI are `devDependencies`; `@tanstack/devtools-vite` strips devtools from production builds. Package name is `jed`; we use npm (no pnpm config). `@tanstack/react-start` must stay >= 1.168.60 and `@tanstack/start-server-core` >= 1.169.39 (CVE-2026-102989); the latter and the devtools-only `seroval` are enforced through `overrides` in `package.json`. Lint/format is Biome (`biome.json`; `src/components/ui/**` is shadcn-generated and not linted).
- Product name in UI: **JED**. Warm off-white surfaces, ink (`#111111`) primary, deep green accent (`#1F5E4B`) on marketing focus rings. Public `/` is a structured marketing page (hero, included list, start steps, contact). Auth: split layout with solid ink aside + form (Inter, 8px radius in `.jed-auth`). **Admin** (`.jed-admin` in `src/styles/admin.css`): full-width chrome (`admin-page` / `admin-page-main`, no max-width column), Inter, 12px radius, collapsible 248px/72px sidebar (Site/System groups, remembered per device), breadcrumbs on every page, Cmd/Ctrl+K command palette (nav + quick actions), appearance toggle (light/dark/system, `data-admin-theme` on `<html>` with blocking init script, no flash), dashboard cards (recent content, drafts, activity, quick actions, system status; no vanity stat tiles), shared list empty/loading/error states; rebrand via `--brand` (default `#111111` from `#/lib/cms/brand-defaults`). BlockNote editor is client-only (`*.client.tsx`). App and marketing use Inter Variable. Icons: **Phosphor** (`@phosphor-icons/react`, `weight="regular"` via `#/lib/icon`). No `class="dark"` on `<html>`.

---

## Catch-up (what is already built)

Use this as orientation. If it disagrees with code, fix the code *and* this section.

### Routes

| Path | Who | Notes |
|---|---|---|
| `/` | public | shadcn-inspired marketing home (centered hero, announcement pill, 3×2 product showcase grid, 9-item features grid, three getting-started steps, multi-column footer). Geist + zinc tokens, light default, header theme toggle (`jed-marketing-theme` in `localStorage`, `html.dark`). Full-width sticky header border. `Reveal` + `marketing-home.css` / `marketing-shadcn.css`. Document title is the site name. `getPublicMarketingFn` loads `site_settings` (CMS `--brand` on CTAs only via `applyMarketingBrandCss`) |
| `/contact` | public | Full-page contact form (`submitContactMessageFn`: honeypot, rate limit, `mailto` when `contact_email` set). Friendly fallback when email unset. `MarketingSiteShell`, public cache |
| `/search` | public | Site search (`?q=`, `page`). `search_published_content` RPC (FTS + ilike fallback). Highlights via safe `<mark>` parse. `MarketingSiteShell`, public cache |
| `/features`, `/features/api-and-mcp` | public | Quill copy from `content/starter-docs/features/*.md` via `#/lib/starter-docs/parse-features`. Pixel layout in `starter-docs.css` + `StarterFeaturesShell`. Nav/footer link from `MarketingSiteShell`. Public cache |
| `/docs`, `/docs/$slug` | public | Quill copy from `content/starter-docs/docs/*.md` (`import.meta.glob`, `marked` + `sanitize-html`). Sidebar groups in `#/lib/starter-docs/catalog`, Cmd+K search, TOC, code Copy buttons. `DocsShell`, `publicHead`, public cache |
| `/login`, `/signup`, `/forgot-password`, `/check-email`, `/reset-password`, `/update-password` | public (signup grants `member` only) | Marketing site chrome + centered auth card (`MarketingAuthLayout`, `auth-marketing.css`; card up to 480px, 24px phone gutters). Google OAuth + divider when `VITE_AUTH_GOOGLE_ENABLED`. Site name from `getAuthBrandingFn`. `staleTime`/`gcTime` 0, no preload, `private, no-store`. `search.redirect` sanitized. Signed-in visitors redirect via `getSignedInRedirectHrefFn`. Password and MFA sign-in return `{ redirectTo }` and the page does `location.replace` (`#/auth/sign-in-navigation`). Callback errors: `?reason=sign_in_failed` on login, `?reason=link_expired` on forgot. Sign-up confirmation navigates to `/check-email` |
| `/auth/callback` | public | PKCE via `#/auth/handle-auth-callback.server`; `next` must be a same-origin path; recovery → `/reset-password` |
| `/reset-password` | session (recovery) | Set password after email link (`/auth/callback?next=/reset-password`). `AUTH_PAGE_CACHE` + `noindex` |
| `/update-password` | session | Signed-in password change. Same no-store / no-cache router settings as other auth pages |
| `/blog`, `/blog/$slug` | public | `/blog` is a layout route (`<Outlet />`); index at `blog.index.tsx`, posts at `blog.$slug.tsx`. Featured latest post + paginated grid (`category` / `tag` filters). SSR via `MarketingSiteShell`. `draftPreview` for admins. `/blog/rss.xml` RSS. Public cache |
| `/$slug` | public | Published CMS pages (`content_entries` kind `page`). Reserved slugs in `#/lib/cms/pages` |
| `/sitemap.xml` | public | Paginated published pages and posts, docs toggles, `lastmod` from content or settings (not request time), exclusions; `PUBLIC_XML_CACHE_HEADERS` (`s-maxage`) |
| `/llms.txt` | public | Plain-text site summary for LLM crawlers; `PUBLIC_XML_CACHE_HEADERS` |
| `/robots.txt` | public | Dynamic `Sitemap:` line, indexing toggle, preview `Disallow: /` (replaces static `public/robots.txt`) |
| `/account` | signed in | Pixel marketing shell: profile (avatar upload to `avatars` bucket, display name), password, two-factor (respects `mfa_enabled`), admin link, sign out. `_authenticated` `beforeLoad` runs `getMfaGateRedirectFn`. `PRIVATE_ROUTE_CACHE`, `PRIVATE_ROUTE_HEADERS` |
| `/admin/login` | public | Admin sign-in card; `AUTH_PAGE_CACHE` + `noindex` |
| `/admin` | `admin.access` | Dashboard (live CMS counts, recent content/activity). `ADMIN_ROUTE_CACHE`, `private, no-store`. Missing `admin.access` redirects to `/` |
| `/admin/content`, `/admin/content/$id` | `content.read` / `content.write` | Paginated list + BlockNote writing desk (`?tab=content|seo|settings`): resizable sidebar (localStorage), cover in sidebar, slug from title, View/Preview when published |
| `/admin/media` | `media.read` | Thumbnail grid, detail dialog with large preview, alt text edit (`media` bucket) |
| `/admin/users` | `admin` + `roles.manage` (service role) | Tabbed members and roles (`?tab=members|roles`). Paginated directory (10/25/50/100) with status, MFA, role, created range, and search filters; add-user modal. Roles tab: custom role CRUD (`#/auth/roles-admin`). User CRUD via `#/auth/users-admin` + service role. API roles routes |
| `/admin/settings` | `settings.read` | Tabbed settings (`?tab=general|branding|seo|integrations|domains`): site identity, branding, SEO, integrations, external redirect hosts; sticky save bar; per-field help popovers. Auth redirect paths and **MFA** (`mfa_enabled`, `mfa_policy`; audit on change) |
| `/mfa-setup`, `/mfa-challenge` | signed in | TOTP enrollment and step-up when site policy or enrolled factors require it. Same `MarketingAuthLayout` chrome as public auth. Exempt from MFA gate redirects |
| `/admin/redirects` | `admin.access` | Tabbed rules and allowed hosts (`?tab=rules|hosts`); URL redirect CRUD (`url_redirects`); hosts sync with settings domains |
| `/admin/audit` | `admin.access` | Paginated audit log (actor, action, target type, search, site-timezone datetime range with presets). URL `page` / `pageSize` |
| `/admin/sql-templates` | `admin.access` | Read-only SQL catalog from bundled migrations + seed (explanations in `#/lib/cms/migration-explanations`; applied badge via `list_applied_schema_migrations`) |
| `/admin/database` | `admin.access` | Tabbed read-only Postgres insights (`?tab=overview|tables|diagram|activity`). `requireAdminRead` + service_role RPCs from `20261016010000_admin_database_insights.sql`; 60s server cache |
| `/admin/api` | `admin.access` | Tabbed tokens, usage, and clients (`?tab=tokens|usage|clients`). Personal access tokens, MCP JSON, OpenAPI link (`#/auth/api-tokens-fns`, `#/domain/*`, `/api/v1`, `/api/mcp`) |
| `/api/v1/*`, `/api/mcp` | bearer token or public (search) | Versioned REST + stateless MCP; reads + writes (content, posts, settings, `/me`, admin users); `Idempotency-Key` on token writes (MCP may pass `idempotencyKey` or JSON-RPC id); `api_idempotency` table; OpenAPI at `/api/v1/openapi.json`; MCP requires bearer; `/api/mcp/oauth` is a documented OAuth placeholder (501); destructive MCP tools need `confirm: true`; `SUPABASE_JWT_SECRET` for token auth; RLS via user-scoped JWT. HTTP cache: `#/lib/http-cache.server` (`cacheHeaders` on every `/api/v1` response); anonymous public CDN + Vercel Runtime Cache only for `GET /api/v1/openapi.json` and `GET /api/v1/public/search` (no anonymous content GET); MCP always `private, no-store`. Docs: `/docs/caching`. |
| `/admin-panel`, `/admin-panel/*` | public | Legacy redirects to `/admin`, `/admin/users`, `/admin/content` |
| `/roles` | signed in | Redirects to `/admin/users` |

Pathless `_authenticated` redirects anonymous users to `/login?redirect=…`. That is **UX only**. Every `createServerFn` still calls `requireUser()` / `requirePermission(...)`.

Private responses: `Cache-Control: private, no-store`.

### Accessibility baseline

- Every page has exactly one `h1` and one `<main id="main-content" tabIndex={-1}>` (`MAIN_CONTENT_ID` from `#/components/a11y/skip-link`) at every breakpoint, plus a `<SkipLink />` as the first tab stop. `MarketingAuthLayout`, `AdminShell` and `/account` already do this; new page shells must too. Auth form titles are the page `h1` inside the marketing auth card.
- Landmarks are labelled when repeated: admin `aside` ("Admin sidebar", "Selected person"), `nav aria-label="Admin"`.
- Auth form errors use `<AuthFormError message={error} />` (always-rendered `role="alert"`, id `AUTH_ERROR_ID`). Fields take `invalid` and set `aria-invalid` + `aria-describedby={AUTH_ERROR_ID}`. Success notes use `role="status"`. Other inline errors are `role="alert"` too.
- The admin directory filter is a real Radix `Tabs` with a `TabsContent` panel (not bare triggers).
- Check with axe on `/login`, `/forgot-password`, `/update-password`, `/account`, `/admin-panel*` at 1280 and 390 px. `muted-foreground` is 5.5:1 on `card`, 4.7:1 on `background`, 5.0:1 on `muted`; `destructive` 5.3:1 on `card`.

### SEO, errors and 404

- `src/lib/seo.ts`: `SITE_NAME`, `pageTitle()`, `noindexHead(title)`, `publicHead({...})`, `NOINDEX_HEADERS`. Root `head()` (`__root.tsx`) sets viewport, default title/description, OG site/type, Twitter card and the favicon (`public/favicon.svg`). Titles use the `Page · JED` template.
- **Every private or session route is `noindex`**: `noindexHead()` in `head()` **and** `X-Robots-Tag: noindex, nofollow` (`AUTH_PAGE_HEADERS` for `/login`, `/forgot-password`, `/update-password`; the `_authenticated` layout for `/account` and `/admin-panel/*`). New private routes must do both. Public indexable routes use `publicHead()` (canonical + OG URL).
- Canonical / `og:url` origin = the validated `APP_URL` (`getAppUrl()` in `src/lib/app-url.server.ts`, via `getSiteUrl()` and `getSiteUrlFn`, resolved once by the root loader with `staleTime: Infinity`). On Vercel previews without `APP_URL` it falls back to `https://$VERCEL_URL`. Never from the Host header. If it cannot be resolved there is no canonical, not an error.
- `/robots.txt` is a public route (see table). Preview deployments and the sitewide indexing toggle can emit `Disallow: /`. `/login` and `/forgot-password` stay crawlable so their `noindex` meta is seen.
- `router.tsx` sets `defaultErrorComponent` (`RouteErrorPage`), `defaultNotFoundComponent` (`NotFoundPage`) and `defaultOnCatch` (logs the real error). Error UI shows fixed copy only, never `error.message`, stacks or causes.
- `requireUser` / `requirePermission` set HTTP **401** / **403** on RPC responses (`setResponseStatus`) and throw the fixed messages in `#/auth/errors`. Page loaders and `beforeLoad` wrap server fns in `withAuthRedirects()`: Unauthorized -> `/login?redirect=…`, Forbidden -> `/account` (SSR can only emit 200/404/500, so a redirect avoids a 500). Client-side use of `classifyAuthFailure` shows the 401/403 error page.

### Auth module (`#/auth`)

- Session I/O lives here only: `getCurrentUser`, `requireUser`, `requirePermission`, `getAccess`, sign-in/up/out, password reset.
- **Per-request auth context** (`session.server.ts`): a `WeakMap<Request, …>` (collected with the request, never module-level user state) holds one cookie-backed Supabase client, one `getUser()` result and one access result per user id. `requireUser` / `requirePermission` / `getAccess` share it, so an SSR page load does one `getUser()` and one roles->permissions query. Use `getRequestClient()` for reads in server fns; call `clearRequestAuth()` after anything that changes the session (sign in/up/out, password update). Each client RPC is its own request and pays one `getUser()` + one access query.
- Access = **one query**: `user_roles` -> `roles` -> `role_permissions` through the foreign keys (PostgREST embed). Keep those FKs.
- `getSessionFn` (user + access) feeds the `_authenticated` layout; descendants (admin gate) read `context.access` instead of calling the server again. UX only; every server fn still re-checks.
- Server fns that list rows take validated `q` / `role` / `page` (`parseDirectoryQuery`) and page in Postgres (`.range`, exact count). Escape user text for `ilike` with `escapeLike`.
- AppUser DTO: `{ id, email }`. Never return GoTrue `User`, JWTs, or cookie stores to the client.
- Server-only: `session.server.ts` (`getUser()`, not `getSession()` alone). RPC: `functions.ts`.
- Permission codes: `PERMISSIONS` in `permissions.ts`. Unknown DB codes are dropped (fail closed).

### Data (Postgres + RLS)

Migrations: `supabase/migrations/`. Apply remotely with Supabase MCP `apply_migration`; keep the matching SQL file in git.
Default privileges on `public` are revoked for `anon` and `authenticated`; every new table, view, sequence, and function needs explicit `GRANT`s in its migration (least privilege; column grants for sensitive tables).

| Table / fn | Purpose |
|---|---|
| `profiles` | `user_id` → `auth.users`; email synced by private trigger. Column grants hide `email` from session clients; `display_name` / `avatar_url` readable for bylines (`profile_bylines` view). Admin directory email via service role |
| `permissions`, `roles`, `role_permissions`, `user_roles` | Table-backed RBAC |
| `public.has_permission(text)` | SECURITY DEFINER helper for RLS (`(select auth.uid())`) |
| `private.handle_new_user` | Inserts `profiles` + `user_roles(member)` on signup |
| `public.is_admin()` | `true` when session user has `user_roles.role_code = 'admin'`; CMS RLS + `requireAdmin()` (`#/auth/admin.server`) / `isAdmin(access)` (`#/auth/admin`) |
| `public.posts` | Blog posts (BlockNote `body_blocks` + `body_html`); public read published/scheduled |

Seeded roles: `member` (system, default), `admin` (system). Last `admin` assignment cannot be deleted.

| Permission | Meaning |
|---|---|
| `admin.access` | Open `/admin` |
| `content.read` / `content.write` | CMS entries |
| `media.read` / `media.write` | Media library |
| `settings.read` / `settings.write` | Site settings |
| `profiles.read_all` | Read every profile |
| `roles.read_all` | Read every `user_roles` row |
| `roles.manage` | Assign/revoke roles (and non-system role catalog writes) |

System roles (`is_system = true`: `member`, `admin`) are read-only through the API: `role_permissions` insert/delete policies require the target role to be non-system, so a `roles.manage` holder cannot strip `admin` or widen `member`. Change system-role mappings in a migration. `profiles` user-editable columns: `display_name`, `avatar_url` (owner update policy). Email is not selectable through the user-scoped client; account UI uses Auth email. Migration: `20261015182200_profiles_email_visibility.sql` (replaces `profiles_select_all` with byline-friendly RLS + column grants).

New signups get **member** only. Do not grant admin from JWT `user_metadata`.

### Setup and env

- Post-sign-in paths load via `loadAuthRedirectSettings()` (`get_site_auth_redirects()` SECURITY DEFINER RPC). With no `?redirect`, only `admin.access` uses the admin path; everyone else uses the member path, and the legacy `/account` value means `/`. Password and MFA sign-in return that path; the login page replaces the document (`location.replace`) instead of throwing a router redirect. `/admin` sends anyone without `admin.access` to `/`. User admin mutations write `audit_log` with the admin session client (`auth.uid()`), not the service role.
- Env contract lives in `.env.example` (`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` with legacy `VITE_SUPABASE_ANON_KEY` / `VITE_SUPABASE_KEY` aliases on the server; server-only `APP_URL` with apex/www treated as trusted siblings for CSRF). Auth/session SSR uses `tryCreateClient()` so misconfigured keys log and degrade to signed-out instead of HTTP 500 on `/login`. Update it whenever an env var is added.
- Local Supabase: `supabase/config.toml` + `supabase/seed.sql` (`supabase start`, `supabase db reset`). Hosted: `supabase link` + `supabase db push`. First admin: SQL snippet in `README.md`.
- Deploy target is Vercel; client sites start as a clone of this repo and pull later updates through a `starter` git remote. The README has the Vercel setup and "Updating from the starter" steps; keep them current.

### Adding a permission (checklist)

1. Insert `permissions` + `role_permissions` (migration + local SQL).
2. Add the code to `PERMISSIONS`.
3. RLS: `TO authenticated` plus `has_permission(...)` and/or ownership.
4. Gate the `createServerFn` with `requirePermission(...)`.
5. Optional UI hide; never UI-only.
6. Update this catch-up table.

---

## TanStack Start

Code is **isomorphic by default**. `loader`s run on the server (SSR) **and** in the browser on client navigations. Secrets, cookies, and privileged I/O belong in `createServerFn` (or `server.handlers`), not in the loader body.

```tsx
const getProfile = createServerFn({ method: 'GET' }).handler(async () => {
  // cookies / service role / RLS-backed reads
})

export const Route = createFileRoute('/account')({
  loader: () => getProfile(),
  component: AccountPage,
})
```

- New pages: add a file under `src/routes`.
- Internal navigation: `Link` / `navigate` from `@tanstack/react-router` (typed `to`).
- Auth UX: pathless `_authenticated` + `beforeLoad` + `throw redirect({ to: '/login' })` via `#/auth`.
- Auth security: `beforeLoad` does **not** protect `createServerFn`. Re-check in every private handler.
- Mutations: `useServerFn`, then invalidate router/query cache.
- Request helpers (`getRequest`, cookies, headers): `@tanstack/react-start/server` **inside** `.handler()` / middleware — never at module scope.
- Prefer inferred types. Do not cast away router or server-fn inference.

### Server vs client

| Need | API |
|---|---|
| Secrets, cookies, DB, service role | `createServerFn` — auth inside the handler |
| File must never ship to the client | `*.server.ts` or `import '@tanstack/react-start/server-only'` |
| Must never run on the server | `*.client.ts`, `createClientOnlyFn`, `<ClientOnly>` |
| Different impl per env | `createIsomorphicFn().server().client()` |

Loader data, RPC returns, router context, and SSR HTML are **visible to the client**. Return DTOs only — not DB rows, JWTs, cookies, `service_role` clients, or GoTrue `User`.

- Secrets: unprefixed env, read **inside** `.handler()`. Never module-scope secrets, never `VITE_*` for secrets.
- Public env only: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`.
- Client/UI must not import cookie helpers, `@tanstack/react-start/server`, or `*.server.ts`.

---

## Supabase and auth portability

Use Supabase Auth today. Verify current Supabase docs/changelog; do not copy APIs from memory.

- Browser: URL + publishable/anon key only. Never `service_role` in the client or `VITE_*`.
- Server: cookie-backed user client; service-role only for admin jobs that cannot use RLS.
- Sessions: HttpOnly cookies (`@supabase/ssr` or equivalent), not `localStorage`.
- Inside `#/auth` only: `supabase.auth.getUser()` (not `getSession()` alone).

**Better Auth later:** all session I/O in `#/auth` (`getCurrentUser`, `requireUser`, `requirePermission`, `signIn*`, `signOut`). Features use `{ id: string; email: string | null }`, not GoTrue `User`. Tenancy lives in **our** tables (`profiles`, `user_roles`). Do not add a second auth library “just in case.”

- RLS on every exposed table. `TO authenticated` **plus** ownership (`(select auth.uid()) = user_id`).
- UPDATE: both `USING` and `WITH CHECK`. Views: `security_invoker = true`.
- Do not authorize from `user_metadata`. Roles in tables, not JWT-only.

---

## TypeScript and React

- `strict`, `verbatimModuleSyntax`, unused locals/params. `import type` for types.
- Functional components. Colocate route-only UI; extract when a second caller appears.
- Server fn input: `.validator()`. A parsed id is not authorization.
- Do not swallow errors — log and rethrow (or return a client-safe error).
- No `any` / `as` to escape TanStack inference.

---

## UI

**Chosen kit: shadcn/ui.** Official Vite + React docs and `npx shadcn@latest` only. Do not install Chakra, MUI, or Mantine. Do not add a second kit or CSS-in-JS (Emotion, styled-components, MUI `sx`).

**Taste is mandatory on every UI change.** Before writing markup, apply `design-taste-frontend` (tasteskill) plus `frontend-design`. Product/admin surfaces follow the same anti-slop rules even though tasteskill’s landing-page examples are marketing-shaped.

JED rules (do not regress):

- Cool gray + black + one blue signal. No mint/lime Keyvo look, no AI purple, no Inter, no Instrument Serif. Auth: split silk panel + pill fields, email/password only (no fake social). Admin is a full-bleed shadcn kit (labeled sidebar expanded by default + hairlines + inspector), not the old floating window. Overview is fed by `getAdminOverviewFn` — real people/role counts only; no fake issues, timers, or charts. Pages are a stub until content tables exist.
- Structure with type, hairlines, and `divide-y` first. Cards only when elevation means something.
- Use **Phosphor** (`@phosphor-icons/react`, regular weight). Pick concrete glyphs (file, lock, gear), not sparkle or star motifs. Do not add Motion/GSAP unless asked.
- Self-hosted fonts only. Do not add Google Fonts `<link>`s.
- Verify in the browser. Motion answers user action; no load-in stagger on every block.

Tailwind v4 is already configured. Theme = shadcn CSS variables. Keep Radix a11y (focus, keyboard, labels). Admin chrome: `#/components/admin/admin-shell`. Account: Pixel layout on `/account` (`#/components/account/*`, `#/lib/account/*`). Auth chrome: `#/components/auth`. Brand: `#/components/brand`.

If asked for Chakra / MUI / Mantine, implement with shadcn + Tailwind instead.

**Dialogs and sheets:** `#/components/ui/dialog` exports `DialogHeader`, `DialogBody`, and `DialogFooter` with shared horizontal insets (`px-4 sm:px-6`) and a footer that stays inside the rounded shell (no negative margins). Put scrollable main content in `DialogBody`. Sheet uses the same inset pattern via `SheetHeader` / `SheetBody` / `SheetFooter`.

**Admin page inset:** `AdminShell` wraps breadcrumbs and route output in `.admin-page-layout` using `--admin-page-pad-x` (1.5rem, 2rem from `md`) so crumbs, titles, and full-width editors share one left edge. Do not add a second `admin-page` wrapper on list pending/error states.

**`cn` helper:** `cn()` is the official `cn` npm package (what shadcn CLI 4.x installs). `src/lib/utils.ts` re-exports it (`export { cn } from 'cn'`) so `components.json` `aliases.utils` (`@/lib/utils`) resolves. Import it as `import { cn } from '@/lib/utils'` in `src/components/**`. Components added with `npx shadcn@latest add <component>` may import `cn` from `"cn"` directly; both work and no cleanup is needed.

---

## Security

Fail **closed**. UI-only protection is not enough. Check this on **every** new or changed route, form, server fn, and redirect — not only auth work.

- `requireUser()` in every private `createServerFn` / server route. `beforeLoad` is UX only.
- Privileged work: `requirePermission(...)` from `#/auth` plus matching RLS. Roles live in `roles` / `user_roles` / `role_permissions`, not JWT `user_metadata`.
- IDOR: after `.validator()`, check the row belongs to the session user/org. A parsed id is not authorization.
- No secrets in client modules, loader/RPC payloads, or router context.
- Cookies: `HttpOnly` + `Secure` + `SameSite`. Sessions in cookies (`@supabase/ssr`), never `localStorage`.
- XSS: render user/DB/error text as React children only. No `dangerouslySetInnerHTML`. No `javascript:` URLs. Cap input length to match the server (email 255, password 8–72).
- Redirects: in-app `to` or allowlisted origin. `search.redirect` / callback `next` go through `safeInternalPath` in `#/auth` (same-origin path only; decode loops; drop `//`, `://`, `\`, control chars, paths over 512). Use that helper — do not reimplement.
- Session `createServerFn`s call `markPrivateNoStore()` (`Cache-Control: private, no-store`). Auth page redirects include the same header. Never `Cache-Control: public` on session/tenant responses.
- Mutations: POST + origin checks. No GET mutations. Auth forms: `method="post"` + `createServerFn({ method: 'POST' })`.
- Client-safe error messages only (fixed strings). Log stacks/SQL/env on the server only. Password reset and invites must not reveal whether an email exists.
- Auth email links (`emailRedirectTo` / `redirectTo`) use the server-only `APP_URL` env (`#/lib/app-url.server`, validated, https-only in production, `VERCEL_URL` fallback on Vercel *preview* only). Never build them from `getRequestUrl()` / the Host header.
- `src/start.ts` registers global request middleware: Start's CSRF check for server functions (required because a custom `start.ts` disables the automatic one) and `securityHeadersMiddleware` (`#/lib/security-headers.server`): nonce CSP (`script-src 'self' 'nonce-…' 'strict-dynamic'`, `frame-ancestors 'none'`, `connect-src` = self + the Supabase origin, `style-src` keeps `'unsafe-inline'` for Radix style attributes), HSTS (production), `Referrer-Policy`, `X-Content-Type-Options`, `X-Frame-Options`, `Permissions-Policy`. The nonce reaches the router through `ssr.nonce` in `router.tsx`. CSP is Report-Only in dev (Vite HMR). Add new external origins to the CSP builder, not inline. Edge-cached public HTML uses per-response `script-src` SHA-256 hashes of inline bodies (TanStack hydration transport scripts, JSON-LD, analytics bootstrap), not nonces; only inline `<script>` tags with the request SSR `nonce` are hashed (including TanStack `data-tsr-stream-part` tags). `#/lib/ssr-nonce.server` binds that nonce on the `Request` before `getRouter()` runs so hydration scripts receive `router.options.ssr.nonce` on Vercel. `#/lib/apply-public-html-csp.server` builds `script-src` from shipped HTML (no orphan hashes) and fails closed if any inline script lacks a matching hash. Public HTML CDN entries carry `Cache-Tag: html-csp-v2` after CSP policy changes. `public-route-html-csp.integration.test.ts` exercises the built `.vercel/output` handler after `npm run build`. Do not put secrets in inline scripts. Static assets served by the Vercel CDN do not pass through this middleware.
- Uploads/webhooks: size/type limits; verify signatures.
- Do not disable RLS or add `SECURITY DEFINER` / service-role to “make it work.”
- **Admin-only Postgres RPCs** (`SECURITY DEFINER` + in-function admin check): end migrations with `revoke all on function … from public`, `grant execute … to authenticated` only, and **`revoke execute on function … from anon`** even when anon was never granted. Trigger/helper functions that must run with `search_path = ''` schema-qualify builtins (`pg_catalog.to_tsvector`, etc.).

### Public HTML Content-Security-Policy

Full policy, incident history, production verification, and change checklist: **[docs/security/csp.md](docs/security/csp.md)**.

Rules in brief: `bindSsrNonceMiddleware` binds the SSR nonce on the `Request` before any `getRouter()` call; `getRouter()` must use `requireRequestSsrNonce()`; public HTML CSP hashes **only** nonce-marked inline scripts in shipped bytes (including `data-tsr-stream-part`); reject orphan `sha256-` entries; never add `'unsafe-inline'` to public `script-src`; never trust nonce-less or body-shape stream scripts. CSP changes require `npm run build`, `public-route-html-csp.integration.test.ts` (built handler, two fetches of `/`), and Shield review on the PR.

---

## Memory

Treat components and server modules as long-lived. A feature is not done if it can leak after navigate-away or sit unbounded in RAM.

- Every subscription (`useEffect`, Realtime, timers, `AbortController`) must unsubscribe/abort on unmount.
- After `await` in a component: do not `setState` unless the tree is still mounted (`useAuthSubmit` on auth forms, or the same mounted-ref pattern).
- Prefer CSS for ambient motion (auth silk). Do not add JS loops, `setInterval`, or animation libraries unless asked.
- Paginate/window lists. Derive in render — do not mirror props into state.
- Don’t keep the previous route’s lists in a parent. Session/auth routes: `gcTime: 0` so user/email DTOs do not linger. Other lists: set `gcTime` deliberately.
- Small DTOs for SSR. Don’t close over huge values in handlers. Cap request bodies (email/password lengths, list `limit`s).
- **Server:** no request `user`/cookies in module-level `let`/`Map`. Reuse one DB/Supabase client per process. Paginate. Don’t `arrayBuffer()` entire uploads. In-memory caches need TTL + max size.

---

## Caching

Decide cache policy **when the route or server fn is created**, not later. Public identity-free data stays cached (that is how marketing stays fast). Session data stays uncached (that is how auth stays safe). Not Next.js: no `revalidate` / `unstable_cache`. Router `staleTime` defaults to `0` — override only on public identity-free routes.

| Kind | Router | HTTP |
|---|---|---|
| Public, stable (marketing, legal, pricing, docs) | `staleTime: Infinity` (or hours); long `gcTime` | `PUBLIC_CACHE_HEADERS`: `public, max-age=300, s-maxage=300, stale-while-revalidate=600` |
| Public, slow-changing | minutes–hours | `public` + SWR |
| Auth gates (`/login`, `/forgot-password`, `/update-password`) | `AUTH_PAGE_CACHE` in `#/auth` (`staleTime`/`gcTime` 0, `preload: false`) | `AUTH_PAGE_HEADERS`: `private, no-store` |
| Signed-in shell (`/_authenticated`, `/account`) | `PRIVATE_ROUTE_CACHE` in `#/auth` (`staleTime` 60s, `gcTime` 5m) — `getAppShellFn` + client `cachedFetch` (90s TTL); clear on sign-out | `PRIVATE_ROUTE_HEADERS`: `private, no-store` |
| Admin (`/admin/*`) | `ADMIN_ROUTE_CACHE` (60s / `gcTime` 5m); router `defaultPendingMs` 250 / `defaultPendingMinMs` 500; `defaultGcTime` 5m | `private, no-store` |
| Private / session (other) | short or `0`; invalidate on write | `private` + `Vary: Cookie` or `no-store` — **never `public`** |
| Sensitive (session RPC, password, roles) | do not cache | `no-store` via `markPrivateNoStore()` |

`Cache-Control: public` only when bytes are identical for every caller.

- One cache owner: Router for URL-shaped data; Query only if reused off-route. Admin/signed-in shells align `defaultPreloadStaleTime` (60s) with `PRIVATE_ROUTE_CACHE` / `ADMIN_ROUTE_CACHE`. No double-cache.
- `loaderDeps` = only inputs the loader uses.
- After writes: invalidate the routes that changed — not every public page.
- Hashed Vite assets are immutable.
- One `getUser()` per request: never call `supabase.auth.getUser()` outside the memoised `getCurrentUser`.
- Do not hover-preload session checks (`preload: false` on auth). Do not give login HTML a public CDN TTL — `beforeLoad` redirects differ by cookie.
- Public HTML CDN entries must not be served to signed-in browsers: `vercel.json` route transforms add `__amn_edge_cred=1` when the request has an `Authorization` header or a Supabase Auth cookie (`sb-*-auth-token`; routing runs before the CDN cache). Origin logic in `#/lib/seo/request-policy.server` and `src/start.ts` still returns `private, no-store` for those requests. Anonymous HTML uses `Vary: Accept-Encoding, Authorization` and `Cache-Tag` (`content`, `blog`, …). Blog loaders use `#/lib/supabase/anon-read.server` unless `?draftPreview=true`.

---

## Working agreements

- Follow existing files first. Do not add libraries, folders, or env vars unless the task needs them.
- Before marking work done: confirm cache headers/`staleTime`, no leftover subscriptions or post-unmount `setState`, and fail-closed auth/redirects/XSS. Fix those in the same task.
- Pin `@supabase/*` and commit the lockfile when those packages change.
- Do not commit secrets (`.env`, service role).
- **Keep agent docs current in the same PR/task:** edit `AGENTS.md` catch-up + the relevant policy section. Leave tool adapters as `@AGENTS.md` / one-liners. Do not start a second source of truth.
