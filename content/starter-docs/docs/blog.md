---
title: Blog
description: Writing and publishing posts, the public blog pages, and the RSS feed.
slug: /docs/blog
order: 6
---

# Blog

The blog has public pages for readers and an editor in the admin panel for writing.

## Public pages

| URL | What it shows |
|-----|---------------|
| `/blog` | The list of published posts |
| `/blog/<slug>` | A single post |
| `/blog/rss.xml` | An RSS feed of published posts |

Published posts are also listed in `/sitemap.xml` and included in [search](/docs/search).

## Writing a post

1. Open **Admin > Blog** and create a post.
2. Write in the block editor. You can add headings, lists, images, and other blocks.
3. Set the title, slug, and excerpt. The excerpt appears in the post list, in search results, and in the RSS feed.
4. Preview the post before it goes live.
5. Publish when it's ready.

Post content is cleaned on the server before it's shown, so pasted HTML can't run scripts on your site.

## Who can write

Anyone with `content.read` can see the post list in the admin panel. Creating and editing posts needs `content.write`. Out of the box, only admins have both. See [Roles and permissions](/docs/roles).

## Posts through the API

Admins can list, read, create, and update posts with the [REST API](/docs/api) (`GET /api/v1/posts`, `GET /api/v1/posts/{postId}`, and `POST /api/v1/posts`) or the [MCP server](/docs/mcp) (`list_posts`, `get_post`, and `save_post`). Deleting a post is only possible in the admin panel.
