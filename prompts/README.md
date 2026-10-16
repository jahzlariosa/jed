# Prompt templates for JED

Use these with Cursor, Claude Code, Codex, or any agent that reads `AGENTS.md`.

| File | Use when |
|------|----------|
| `01-new-client-site.md` | Rebrand site name, logo, and `--brand` for a client |
| `02-new-page-section.md` | Add a public page or marketing section |
| `03-new-cms-content-type.md` | Add a CMS content type and admin editor |
| `04-new-table-rls.md` | Add a Postgres table with RLS and migration |
| `05-new-admin-screen.md` | Add an admin screen under `/admin` |
| `06-new-server-function.md` | Add a `createServerFn` with auth and validation |
| `07-security-review.md` | Review auth, RLS, caching, and redirects |
| `08-performance-review.md` | Review bundle, cache headers, and loaders |
| `09-release-checks.md` | Pre-release CI and migration checklist |

Always point the agent at the repo root `AGENTS.md` first.
