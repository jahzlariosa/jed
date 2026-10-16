---
title: MCP server
description: Connect an MCP client such as an AI assistant or editor to your site at /api/mcp.
slug: /docs/mcp
order: 12
---

# MCP server

Your site includes a Model Context Protocol server at `/api/mcp`. Any MCP client that supports Streamable HTTP can connect to it and work with your site's content, settings, users, and logs, with the same permissions as the person who created the token.

## Connect a client

1. Open **Admin > API and MCP**.
2. Create a token and choose its scopes. Copy it right away. It's only shown once.
3. Click **Copy MCP JSON** and paste it into your client's configuration.
4. Replace `YOUR_TOKEN_HERE` with your token.

```json
{
  "mcpServers": {
    "jed": {
      "url": "https://your-site.com/api/mcp",
      "headers": {
        "Authorization": "Bearer YOUR_TOKEN_HERE"
      }
    }
  }
}
```

Every request to `/api/mcp` needs a valid token, including tools that read public data. Without one, the server answers `401` before any tool runs.

OAuth sign-in for MCP clients isn't available. If your client looks for it, `GET /api/mcp/oauth` returns `501` with a short note to use a personal access token in the `Authorization` header.

## Tools

### Reading

| Tool | Scope | Description |
|------|-------|-------------|
| `get_me` | any token | Your profile and access |
| `list_content` | `content.read` | List CMS content entries |
| `get_content` | `content.read` | Get one CMS content entry |
| `list_posts` | `admin.access` | List blog posts |
| `get_post` | `admin.access` | Get one blog post |
| `get_settings` | `settings.read` | Get site settings |
| `list_users` | `admin.access` | List users |
| `list_audit_log` | `admin.access` | List audit log entries |
| `list_sql_templates` | `admin.access` | List bundled SQL templates |
| `get_sql_template` | `admin.access` | Get one SQL template body |
| `search_published_content` | any token | Search published pages and posts |

### Changing things

Every one of these needs both `idempotencyKey` and `confirm: true`.

| Tool | Scope | Description |
|------|-------|-------------|
| `update_me_display_name` | any token | Update your display name |
| `upload_me_avatar` | any token | Upload a profile photo (PNG, JPEG, or WebP, up to 2 MB) |
| `remove_me_avatar` | any token | Remove your profile photo |
| `save_content` | `content.write` | Create or update CMS content |
| `save_post` | `admin.access` | Create or update a blog post |
| `save_settings` | `settings.write` | Update site settings |
| `invite_user` | `admin.access` | Invite a user by email |
| `update_user` | `admin.access` | Update a user's display name or role |
| `deactivate_user` | `admin.access` | Deactivate a user account |

Each tool matches a [REST endpoint](/docs/api) and takes the same fields. Results come back as JSON text.

## Arguments that protect your site

### confirm

Tools that change data only run when you pass `confirm: true`. Without it, the call fails and nothing changes. This gives a person a clear point to approve the change before an assistant makes it. Set your client to ask before it sends a call with `confirm: true`.

### idempotencyKey

Write tools also require `idempotencyKey`, a string up to 128 characters that identifies one change. If your client retries a call with the same key, the site returns the first result instead of making the change again. Keys are kept for 24 hours per token. Use a new key for each new change.

A write call without a key fails with `idempotencyKey is required`.

```json
{
  "name": "save_settings",
  "arguments": {
    "contactEmail": "hello@example.com",
    "idempotencyKey": "settings-contact-2026-10",
    "confirm": true
  }
}
```

## User management rules

The user tools follow the same rules as the admin panel. You can't remove your own admin role, you can't deactivate yourself, and the last admin can't be demoted or deactivated.

## How it runs

The server is stateless. Each request authenticates with the token in its header, so there's no session to keep alive and it works on serverless hosting.

## What a client can't do

A tool call can never do more than the token allows, and the token can never do more than the person who created it. Row level security applies to every query. If a call fails as unauthorized or forbidden, check that the token is still active and has the scope the tool needs.

Every tool call is recorded in the [audit log](/docs/tokens-and-safety#audit-log), and refused writes are logged as `api.denied`.
