---
title: API and MCP
description: A REST API and an MCP server for your site, with scoped personal access tokens and a full audit trail.
slug: /features/api-and-mcp
order: 1
---

## Hero

**Eyebrow:** API and MCP

**Headline:** Give scripts and AI assistants safe access to your site.

**Subhead:** Read and update your site over REST or MCP, behind personal access tokens that respect every permission you've set.

**Primary CTA:** Read the API docs (links to `/docs/api`)

**Secondary CTA:** Connect an MCP client (links to `/docs/mcp`)

## Section: One set of rules for everything

The REST API, the MCP tools, and the admin panel run the same code. A rule you rely on in the admin panel applies to the API too.

## Section: Tokens that can't overreach

Pick the scopes a token needs and when it expires. It never gets more access than you have, and if your role changes, your tokens change with it. Revoke one at any time.

**Link:** Tokens and safety (`/docs/tokens-and-safety`)

## Section: Changes that wait for a yes

MCP tools that change data only run with `confirm: true`, so an assistant has to ask before it saves a page, changes a setting, or invites someone. Every write also carries an idempotency key, so a retry never applies the same change twice.

## Section: Manage people safely

Admins can invite users, change roles, and deactivate accounts from the API. The site won't let anyone remove their own admin role or lose its last admin.

## Section: Row level security on every call

Each request runs as the person who created the token, through a session that lasts five minutes. Content, posts, and settings are always read and written with that person's own access.

## Section: Every call on the record

Token creation, revocation, each API or MCP call, and every refused write are written to the audit log with the token involved. The API usage view shows how often each token is used and when it was last active.

## Section: Ready for your tools

Point any OpenAPI client at `/api/v1/openapi.json`. Paste the MCP config from the admin panel into your assistant and it's connected.

```json
{
  "mcpServers": {
    "jed": {
      "url": "https://your-site.com/api/mcp",
      "headers": { "Authorization": "Bearer YOUR_TOKEN_HERE" }
    }
  }
}
```

## Closing CTA

**Headline:** Create your first token.

**Body:** Open Admin > API and MCP, choose your scopes, and copy the token.

**Button:** Read tokens and safety (links to `/docs/tokens-and-safety`)
