# New public page or marketing section

Read `AGENTS.md` first (caching, security, UI taste).

1. Add or extend a route under `src/routes` with `PUBLIC_CACHE_HEADERS` or `PUBLIC_HTML_HEADERS` as appropriate.
2. Use `publicHead({ pageLabel, path, siteUrl, matches })` so titles use `seo_title_template` from the root loader.
3. One `h1`, `<main id="main-content">`, and `<SkipLink />`.
4. shadcn + Tailwind only; verify at 1280px and 390px.
