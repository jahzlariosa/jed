---
title: Search
description: How public search finds published pages and posts.
slug: /docs/search
order: 7
---

# Search

The `/search` page searches every published page and blog post. Drafts never appear.

## How it works

Search uses Postgres full-text search, so it runs inside your Supabase database with no extra service to set up. Each page and post keeps a search index that updates whenever it's saved.

Matches are ranked by where the words appear:

- **Posts**: title first, then excerpt, then body.
- **Pages**: title first, then body or meta description, then slug.

Results show the title with the matching words highlighted in a short snippet, 12 results per page.

## Search syntax

The search box accepts the same syntax people use in web search:

| Query | Finds |
|-------|-------|
| `garden design` | Results containing both words |
| `"garden design"` | The exact phrase |
| `garden or patio` | Either word |
| `garden -patio` | "garden" but not "patio" |

## URL parameters

| Parameter | Default | Limits |
|-----------|---------|--------|
| `q` | empty | Up to 120 characters |
| `page` | `1` | 1 to 200 |

For example: `/search?q=garden&page=2`.

## Using search from the API

Search is the one API endpoint that works without a token:

```bash
curl "https://your-site.com/api/v1/public/search?q=garden"
```

It's limited to 120 requests per minute. MCP clients can use the `search_published_content` tool, which needs a token like every MCP call. See [REST API](/docs/api).

## If search returns nothing

The search index comes from a migration. If results are always empty, apply all migrations with `npx supabase db push`, or check the [SQL templates](/docs/sql-templates) screen for anything marked "not applied".
