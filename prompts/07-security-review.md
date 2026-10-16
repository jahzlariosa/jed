# Security review

Read `AGENTS.md` Security, Caching, and Memory. Verify `requireUser` / `requirePermission` on every private `createServerFn`, RLS on exposed tables, `safeInternalPath` on redirects, no `Cache-Control: public` on session responses, and no secrets in client bundles. List findings by severity with file paths.
