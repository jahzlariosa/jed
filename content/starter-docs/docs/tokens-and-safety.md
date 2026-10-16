---
title: Tokens and safety
description: Personal access tokens, scopes, idempotency keys, confirmation, usage, rate limits, and the audit log.
slug: /docs/tokens-and-safety
order: 15
---

# Tokens and safety

The API and MCP server use personal access tokens. This page explains how tokens work and what protects your site when you hand one to a script or an AI assistant.

## Before you start

Tokens need these server-only environment variables:

- `SUPABASE_JWT_SECRET`, from **Project Settings > API > JWT Keys** in Supabase.
- `SUPABASE_SERVICE_ROLE_KEY`, used to look up a token by its hash, store idempotency records, and run user invites and deactivations.

If `SUPABASE_JWT_SECRET` is missing, the API and MCP screen won't create tokens and tells you why. Projects that only use asymmetric JWT signing keys aren't supported for tokens.

## Creating a token

Open **Admin > API and MCP** and fill in:

| Field | Notes |
|-------|-------|
| Name | 1 to 120 characters, so you can tell tokens apart |
| Expires in days | 1 to 365. Defaults to 90. |
| Scopes | Pick at least one. You can only pick permissions you already have. |

Only admins can create tokens. The token is shown once, right after you create it. Copy it then, because it can't be shown again. Tokens start with `amn_live_`.

## Scopes

A token can always read and update its owner's own profile with `/me`. Everything else needs a scope.

Scopes are the same as [permissions](/docs/roles): `admin.access`, `content.read`, `content.write`, `media.read`, `media.write`, `settings.read`, `settings.write`, `profiles.read_all`, `roles.read_all`, and `roles.manage`. Give each token only what it needs. A token that reads content for a static site build needs `content.read` and nothing else.

On every request, the token's scopes are compared with your current permissions. A token only keeps scopes you still have, so removing someone's role also limits their tokens immediately.

## How a request is checked

1. The token is hashed and looked up. Only the hash is stored, never the token itself.
2. Revoked and expired tokens are rejected.
3. The server creates a session for the token's owner that lasts five minutes and is used for that request only.
4. Every database query runs as that person, with row level security applied.
5. The endpoint checks that the token has the scope it needs.

Content, posts, and settings are always read and written as that person. The service role key is used only for the few account tasks Supabase reserves for it, such as sending invites and deactivating accounts, and only after the admin check has passed.

## Revoking a token

Every token is listed under **Active tokens** with its prefix, scopes, last use, and status (**Active**, **Expired**, or **Revoked**). Click revoke to stop a token at once. Revoked tokens can't be restored, so create a new one if you need access again.

## Writes are protected twice

Every change made with a token has to say which change it is, so a retry can't apply it twice:

- REST writes need an `Idempotency-Key` header.
- MCP write tools need an `idempotencyKey` argument.

Keys are stored per token for 24 hours. Repeating a key returns the first response. See [REST API](/docs/api#idempotency-keys).

MCP tools that change data also need `confirm: true`. That gives a person a moment to approve the change before an assistant makes it. See [MCP server](/docs/mcp#confirm).

## OAuth

OAuth sign-in for MCP clients isn't available. `GET /api/mcp/oauth` returns `501` and explains that clients should send a personal access token in the `Authorization` header instead.

## API usage

The **API usage** section of **Admin > API and MCP** shows each of your tokens with its number of calls and when it was last used. The counts come from the audit log, so they cover both REST and MCP calls. Check it when you're deciding which tokens are still needed.

## Rate limits

| What | Limit |
|------|-------|
| Requests per token | 600 per minute |
| Profile photo uploads per token | 12 per hour |
| Public search | 120 per minute |

Going over the limit returns `429 Too many requests`.

## Audit log

The audit log at **Admin > Audit log** records security events, including:

| Action | When |
|--------|------|
| `api_token.create` | A token is created (with its prefix and scopes) |
| `api_token.revoke` | A token is revoked |
| `api.<operation>` | Any authenticated API call or MCP tool call, for example `api.get_settings` |
| `api.<operation>.destructive` | An extra entry for calls that change data, for example `api.save_settings.destructive` |
| `api.denied` | A write was refused because the token lacked the scope. Includes the method, path, and status `403`. |
| `user.update` | Someone's display name changes |
| `user.role` | Someone's role changes |
| `user.deactivate` | An account is deactivated |

API entries include the token ID and are marked with the `api` channel, so you can tell them apart from changes made in the admin panel. You can filter the log by action, and read it through the API with `GET /api/v1/audit` or the `list_audit_log` MCP tool.
