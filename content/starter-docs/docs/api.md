---
title: REST API
description: The /api/v1 endpoints for reading and writing site data, with authentication, idempotency, errors, and the OpenAPI spec.
slug: /docs/api
order: 11
---

# REST API

The REST API lives under `/api/v1`. It runs the same code as the admin panel and the [MCP server](/docs/mcp), so the same rules apply wherever a change comes from.

## Authentication

Send a personal access token in the `Authorization` header:

```bash
curl https://your-site.com/api/v1/me \
  -H "Authorization: Bearer amn_live_..."
```

Create tokens in **Admin > API and MCP**. Every request runs as the person who created the token, with row level security applied, and only with the scopes that token was given. See [Tokens and safety](/docs/tokens-and-safety).

OAuth isn't available. `GET /api/mcp/oauth` returns `501` and points you to personal access tokens.

## OpenAPI

The full spec, including request bodies, query and path parameters, and the `Idempotency-Key` header on writes, is at:

```text
https://your-site.com/api/v1/openapi.json
```

Load it into any OpenAPI client or code generator. It's the best reference for the exact fields each endpoint accepts.

## Endpoints

### Your account

Any valid token can use these. No extra scope is needed.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/me` | Your profile and access |
| PATCH | `/api/v1/me` | Update your display name |
| POST | `/api/v1/me/avatar` | Upload a profile photo |
| DELETE | `/api/v1/me/avatar` | Remove your profile photo |

### Content and blog

| Method | Path | Scope | Description |
|--------|------|-------|-------------|
| GET | `/api/v1/content` | `content.read` | List content entries |
| GET | `/api/v1/content/{id}` | `content.read` | Get one content entry |
| POST | `/api/v1/content` | `content.write` | Create or update a content entry |
| GET | `/api/v1/posts` | `admin.access` | List blog posts |
| GET | `/api/v1/posts/{postId}` | `admin.access` | Get one blog post |
| POST | `/api/v1/posts` | `admin.access` | Create or update a blog post |

The API can create and update content and posts. It can't delete them. Use the admin panel for that.

### Settings

| Method | Path | Scope | Description |
|--------|------|-------|-------------|
| GET | `/api/v1/settings` | `settings.read` | Get site settings |
| PATCH | `/api/v1/settings` | `settings.write` | Update site settings |

### Users

These need a token with `admin.access`.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/users` | List users with their roles |
| POST | `/api/v1/users/invite` | Invite someone by email |
| PATCH | `/api/v1/users/{userId}` | Change a user's display name or role |
| POST | `/api/v1/users/{userId}/deactivate` | Deactivate an account |

See [Managing users](#managing-users) below for the rules.

### System and public

| Method | Path | Scope | Description |
|--------|------|-------|-------------|
| GET | `/api/v1/audit` | `admin.access` | List audit log entries |
| GET | `/api/v1/sql-templates` | `admin.access` | List SQL templates |
| GET | `/api/v1/sql-templates/{id}` | `admin.access` | Get one SQL template |
| GET | `/api/v1/public/search` | none | Search published pages and posts |
| GET | `/api/v1/health` | none | Health check |

## Reading data

Read endpoints take their options as query parameters.

```bash
curl "https://your-site.com/api/v1/content?kind=page&status=published&pageSize=20" \
  -H "Authorization: Bearer amn_live_..."
```

| Endpoint | Query parameters |
|----------|------------------|
| `/content` | `page`, `pageSize` (up to 50), `q`, `kind` (`page` or `post`), `status` (`all`, `draft`, `published`, `scheduled`, `pages`, `posts`), `filter` |
| `/audit` | `q`, `role`, `page`, `action` |
| `/users` | `q`, `role`, `page` |
| `/public/search` | `q` (up to 120 characters), `page` |

## Writing data

Write requests send a JSON body with `Content-Type: application/json` and must include an `Idempotency-Key` header.

```bash
curl -X PATCH https://your-site.com/api/v1/me \
  -H "Authorization: Bearer amn_live_..." \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: 6f1c2e9a-rename-1" \
  -d '{"displayName": "Maria Santos"}'
```

### Idempotency keys

The key is any string up to 128 characters that you choose for one specific change. A UUID works well. If a request fails on the network and you aren't sure whether it went through, send it again with the same key:

- If the first request finished, you get its original response back and the change isn't made twice.
- If it didn't, the change is made now.

Keys are tied to your token and are kept for 24 hours. Use a new key for every new change. Reusing a key within 24 hours returns the stored response, even if the body is different.

A write without the header returns `400` with `Idempotency-Key header is required`.

### Create or update content

Send `"id": "new"`, or leave `id` out, to create an entry. Send an existing ID to update it.

```bash
curl -X POST https://your-site.com/api/v1/content \
  -H "Authorization: Bearer amn_live_..." \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: about-page-create" \
  -d '{
    "kind": "page",
    "title": "About us",
    "slug": "about",
    "status": "draft",
    "metaDescription": "Who we are and how we work."
  }'
```

| Field | Notes |
|-------|-------|
| `id` | `new` to create, or an existing ID |
| `kind` | `page` or `post` |
| `title` | Required, up to 255 characters |
| `slug` | Up to 120 characters |
| `status` | `draft`, `published`, or `scheduled` |
| `body` | Block editor content, as an array of blocks |
| `showInNav` | Show the page in the site navigation |
| `publishedAt`, `scheduledAt` | ISO 8601 date and time, or `null` |
| `tags` | Up to 20 tags, each up to 40 characters |
| `featuredMediaId` | A media library ID, or `null` |
| `metaTitle`, `metaDescription` | Up to 120 and 320 characters |

### Update settings

Send only the fields you want to change.

```bash
curl -X PATCH https://your-site.com/api/v1/settings \
  -H "Authorization: Bearer amn_live_..." \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: settings-contact-2026-10" \
  -d '{"contactEmail": "hello@example.com"}'
```

Fields include `siteName`, `siteUrl`, `timezone`, `language`, `brandHex`, `logoUrl`, `seoTitleTemplate`, `seoDefaultDescription`, `socialImageUrl`, `analyticsId`, `webhookUrl`, `contactEmail`, `mfaEnabled`, `mfaPolicy`, and the sign-in destinations `redirectAfterSignInAdmin`, `redirectAfterSignInUser`, `redirectAfterSignUp`, `redirectAfterPasswordReset`, and `redirectAfterSignOut`. Destinations must be paths on your own site, such as `/account`.

### Upload a profile photo

Send the image as base64 along with its type. PNG, JPEG, and WebP are accepted, up to 2 MB. The server checks the file's actual contents, so the type you send has to match the image.

```bash
curl -X POST https://your-site.com/api/v1/me/avatar \
  -H "Authorization: Bearer amn_live_..." \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: avatar-2026-10-15" \
  -d "{\"contentType\": \"image/png\", \"imageBase64\": \"$(base64 -w0 photo.png)\"}"
```

Each token can upload up to 12 photos an hour.

## Managing users

User endpoints are for admins only, and they follow the same rules as **Admin > Users**:

- **Invite**: send `email`, `roleCode`, and optionally `displayName`. Supabase emails the invitation.
- **Update**: send `displayName`, `roleCode`, or both.
- **Deactivate**: blocks the account from signing in. It doesn't delete the account or its content.

To keep the site from losing its admins:

- You can't remove your own admin role.
- You can't deactivate your own account.
- You can't remove the admin role from, or deactivate, the last admin.

These requests return `400` with a message such as `Keep at least one admin`.

```bash
curl -X PATCH https://your-site.com/api/v1/users/<user-id> \
  -H "Authorization: Bearer amn_live_..." \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: promote-maria" \
  -d '{"roleCode": "admin"}'
```

## Health check

```bash
curl https://your-site.com/api/v1/health
```

```json
{ "ok": true, "version": "v1" }
```

## Responses and errors

Responses are JSON. Errors use a single shape:

```json
{ "error": "Keep at least one admin" }
```

| Status | Meaning |
|--------|---------|
| 400 | Invalid request, invalid JSON, a missing `Idempotency-Key`, or a rule such as last-admin protection |
| 401 | Missing, invalid, expired, or revoked token |
| 403 | The token doesn't have the scope this endpoint needs |
| 404 | No endpoint matches the path |
| 405 | `HEAD` and `OPTIONS` aren't supported |
| 429 | Too many requests |
| 500 | Something went wrong on the server. Details are logged, never returned. |

## Caching

Authenticated responses are sent with `Cache-Control: private, no-store`. Public search and the health check can be cached for 60 seconds.

## Audit trail

Every authenticated call is written to the audit log as `api.<operation>`, for example `api.save_settings`, along with the token that made it. Changes like saves, invites, and deactivations also get a second `api.<operation>.destructive` entry. A write that's refused for missing scope is logged as `api.denied`. See [Tokens and safety](/docs/tokens-and-safety#audit-log).
