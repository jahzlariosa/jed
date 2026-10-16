---
title: Roles and permissions
description: The member and admin roles, the permissions behind them, and how to grant admin access.
slug: /docs/roles
order: 5
---

# Roles and permissions

Access is stored in Postgres, and every table is protected by row level security. The app checks permissions on the server, and the database checks them again, so a request that gets past one layer still meets the other.

## Roles

| Role | Who gets it | What it can do |
|------|-------------|----------------|
| `member` | Everyone, automatically at sign-up | Manage their own account |
| `admin` | Granted by SQL or by another admin | Open the admin panel and manage content, media, settings, users, and roles |

Both are system roles and can't be deleted.

## Permissions

| Permission | Allows | `admin` has it |
|------------|--------|----------------|
| `admin.access` | Open the admin panel | Yes |
| `profiles.read_all` | Read every profile | Yes |
| `roles.read_all` | Read every user's role assignments | Yes |
| `roles.manage` | Assign and revoke roles | Yes |
| `content.read` | Read content entries | Yes |
| `content.write` | Create and edit content entries | Yes |
| `media.read` | Read the media library | Yes |
| `media.write` | Upload and delete media | Yes |
| `settings.read` | Read site settings | Yes |
| `settings.write` | Update site settings | Yes |

Members have none of these. They can still read and edit their own profile.

## Granting the first admin

The first admin is always granted in SQL. Run this in the Supabase SQL Editor:

```sql
insert into public.user_roles (user_id, role_code)
select user_id, 'admin'
from public.profiles
where lower(email) = lower('you@example.com')
on conflict do nothing;
```

## Changing roles in the admin panel

After that, admins can change anyone's role from **Admin > Users**. Two rules protect the site:

- You can't remove your own admin role.
- There must always be at least one admin.

The same rules apply through the [REST API](/docs/api#managing-users) and [MCP server](/docs/mcp). There, admins can also deactivate an account, with two more limits: you can't deactivate yourself, and you can't deactivate the last admin.

Every role change is written to the [audit log](/docs/tokens-and-safety#audit-log).

## Roles and API tokens

An API token can never do more than the person who created it. Its scopes are checked against that person's current permissions on every request, so if someone loses the admin role, their tokens lose admin access at the same moment. See [Tokens and safety](/docs/tokens-and-safety).
