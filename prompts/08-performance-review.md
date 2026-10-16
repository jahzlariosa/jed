# Performance review

Read `AGENTS.md` → Caching, Memory, UI.

- Public marketing: `staleTime: Infinity` + `public` cache only when identity-free.
- Session/admin: `private, no-store`, short router `gcTime` where needed.
- Paginate lists; no unbounded subscriptions or post-unmount `setState`.
- `manualChunks` for heavy editors; run `npm run verify:bundle` after admin/editor changes.
- Run `npm run build` and spot-check LCP on `/` and `/blog`.
