---
title: Admin panel
description: A tour of every screen in the admin panel and the permission each one needs.
slug: /docs/admin-panel
order: 10
---

# Admin panel

The admin panel lives at `/admin`. Older `/admin-panel` links redirect there. Admin pages aren't indexed by search engines.

The menu shows only the screens you have permission to open. The server checks the same permissions again on every request.

## Site

| Screen | URL | Permission | What it does |
|--------|-----|------------|--------------|
| Dashboard | `/admin` | `admin.access` | Overview of the site |
| Content | `/admin/content` | `content.read` | Create and edit pages with the block editor |
| Media | `/admin/media` | `media.read` | Upload and manage images |
| Blog | `/admin/posts` | `content.read` | Write, preview, and publish posts |
| Users | `/admin/users` | `roles.read_all` | Invite and create users, change roles, set passwords, send reset emails |
| Inbox | `/admin/inbox` | `admin.access` | Read contact form messages in Inbox, Unread, and Archived tabs, archive them, and reply by email |

## System

| Screen | URL | Permission | What it does |
|--------|-----|------------|--------------|
| Redirects | `/admin/redirects` | `admin.access` | Send old URLs to new ones |
| Audit log | `/admin/audit` | `admin.access` | See who changed what and when |
| SQL templates | `/admin/sql-templates` | `admin.access` | Browse migrations and see which are applied |
| Settings | `/admin/settings` | `settings.read` | Branding, contact email, sign-in destinations, and MFA policy |
| API and MCP | `/admin/api` | `admin.access` | Create and revoke API tokens, see API usage per token, and copy the MCP config |

Editing settings needs `settings.write`. Writing content or media needs `content.write` or `media.write`.

## Settings

| Setting | What it controls |
|---------|------------------|
| Site name | Header, page titles, and sign-in screens |
| Accent color | Buttons, links, and focus rings |
| Logo URL | Public branding |
| Navbar width | Whether the public navbar spans the full screen, sits inside the centred page width, or spans the full screen with its content kept to the page width. Needs the migration `20261017090000_site_layout_widths.sql`. |
| Footer width | The same three choices for the public footer |
| Contact email | Turns on the [contact form](/docs/contact) |
| Sign-in destinations | Where people land after signing in (admins and members separately), signing up, resetting a password, and signing out |
| Allow authenticator setup | Turns MFA on or off |
| Sign-in policy | Who must use MFA. See [Authentication and MFA](/docs/auth-and-mfa). |

Until you save settings, the site uses neutral defaults.

## Users

The Users screen needs `SUPABASE_SERVICE_ROLE_KEY` on the server to create, delete, or change accounts. From here you can:

- Invite someone by email or create an account directly, choosing their role.
- Change a person's role. You can't remove your own admin role, and the site always keeps at least one admin.
- Set a new password for someone, or send them a password reset email.

Every change is recorded in the audit log. Admins can do the same things through the [REST API](/docs/api#managing-users) and [MCP server](/docs/mcp), where deactivating an account is also available.

