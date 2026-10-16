---
title: API caching
description: What is cached on /api/v1 and /api/mcp, response headers, invalidation, and how to verify with curl.
slug: /docs/caching
order: 14
---

# API caching

The API defaults to **no caching**. Responses use `Cache-Control: private, no-store` and `Vary: Authorization, Cookie` unless a route is on the public allowlist and the request has **no** `Authorization` header and **no** `Cookie` header at all.

## What can be cached (anonymous only)

| Route | Cache-Control (anonymous) | Notes |
|-------|---------------------------|-------|
| `GET /api/v1/health` | `private, no-store` | Never cached |
| `GET /api/v1/openapi.json` | `public, max-age=300, s-maxage=3600, stale-while-revalidate=86400` | Strong `ETag` (spec hash + build id). Vercel Runtime Cache |
| `GET /api/v1/public/search` | `public, max-age=60, s-maxage=300, stale-while-revalidate=600` | Strong `ETag`, `Cache-Tag: content, content:list`. Runtime Cache. Cache keys and search execution use the same normalized `q` (trimmed, lowercased, capped; under 2 characters skips cache lookup) and `page` (integer 1 to 1000; non-numeric `page` falls back to 1). JSON `q`/`page` in the body match that normalization. `headline` fields are plain text (mark tags stripped). Rate limit runs once before cache lookup on the cached path |

There are **no** anonymous `GET /api/v1/content` or `GET /api/v1/content/{id}` routes today. Listing or reading CMS entries requires a bearer token with `content.read`, so those responses stay `private, no-store`.

## What is never cached

- Any request with `Authorization` or **any** `Cookie` header (even on `/public/search` or `/openapi.json`)
- All writes, errors, `401`, `403`, and `429`
- Token-backed routes (`/me`, admin APIs, and similar): `private, no-store`, `Pragma: no-cache`
- **`/api/mcp`** (including `OPTIONS`) and **`/api/mcp/oauth`**: always `private, no-store`, no `ETag`, no runtime cache, streams not buffered

## CDN tags and invalidation

Published search responses may include `Cache-Tag` and `Vercel-Cache-Tag` with `content` and `content:list`. Anonymous public routes send `Vary: Accept-Encoding, Authorization` only (no `Cookie` in `Vary`, so the edge can cache). Any `Cookie` header still forces `private, no-store` before a public response is sent.

When CMS content or blog posts change (API writes or admin UI saves), the server calls runtime cache `expireTag` and CDN `invalidateByTag` from `@vercel/functions` for `content`, `content:list`, `content:<id>`, `blog`, and `blog:list` (each call is wrapped in try/catch; failures are logged and writes still succeed).

## Public HTML at the edge

Marketing and blog pages send `Cache-Control: public` with `s-maxage` when the request has no Supabase Auth session cookie, no `Authorization` header, and no `draftPreview` query flag. Responses use hash-based CSP (not nonces) and `Vary: Accept-Encoding, Authorization` only.

Requests with a Supabase Auth cookie (`sb-*-auth-token`, including split chunks `sb-*-auth-token.0`) or an `Authorization` header get a `__amn_edge_cred=1` query parameter at the Vercel edge (`vercel.json` route transforms, evaluated before the CDN cache). That cache key misses the anonymous entry, so the origin runs and returns `private, no-store`. Anonymous repeat requests to `/` and `/blog` can still `HIT` the shared CDN entry.

Blog HTML and `/blog/rss.xml` use a shorter edge TTL (`s-maxage=60`) so scheduled posts can appear without a cron purge; writes still invalidate `blog` / `blog:list` tags immediately.

## Verify with curl

Anonymous OpenAPI (note `public` cache and optional `ETag`):

```bash
curl -sI "https://your-site.com/api/v1/openapi.json"
```

Same URL with a token must be private:

```bash
curl -sI "https://your-site.com/api/v1/openapi.json" \
  -H "Authorization: Bearer amn_live_YOUR_TOKEN"
```

Expect `Cache-Control: private, no-store` and no `ETag`.

Public search (anonymous):

```bash
curl -sI "https://your-site.com/api/v1/public/search?q=hello&page=1"
```

Re-send with the returned `ETag` to check `304`:

```bash
curl -sI "https://your-site.com/api/v1/public/search?q=hello&page=1" \
  -H 'If-None-Match: PASTE_ETAG_HERE'
```

MCP (always private):

```bash
curl -sI "https://your-site.com/api/mcp" \
  -H "Authorization: Bearer amn_live_YOUR_TOKEN"
```
