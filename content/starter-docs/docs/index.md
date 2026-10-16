---
title: Documentation
description: How to set up, configure, and run a site built on JED.
slug: /docs
order: 0
---

# Introduction

JED is a reusable base for branded client sites: auth, admin, content, and a versioned API with MCP. It runs on TanStack Start (React 19 and Vite), stores data and handles sign-in with Supabase, and deploys to Vercel. Each client gets their own copy of the starter, their own Supabase project, and their own Vercel project.

These pages explain how the starter works and how to run it for a real site.

## Start here

- [Getting started](/docs/getting-started): clone the starter, apply the database schema, create the first admin, and run the dev server.
- [Environment variables](/docs/environment): every variable the app reads, where to find each value, and which ones Vercel needs.
- [Deploying to Vercel](/docs/deploy): import the project, set the environment, and point Supabase at your domain.

## Running the site

- [Authentication and MFA](/docs/auth-and-mfa): sign-in, password reset, Google sign-in, and the authenticator policy.
- [Roles and permissions](/docs/roles): the member and admin roles and what each permission allows.
- [Admin panel](/docs/admin-panel): a tour of every admin screen.
- [Blog](/docs/blog): writing, previewing, and publishing posts, plus the RSS feed.
- [Search](/docs/search): how public search finds pages and posts.
- [Contact form](/docs/contact): how messages reach you.
- [SQL templates](/docs/sql-templates): the migration catalog inside the admin panel.

## API and MCP

- [REST API](/docs/api): read and write endpoints under `/api/v1`, idempotency keys, user management, and the OpenAPI spec.
- [MCP server](/docs/mcp): connect an MCP client to `/api/mcp`, and how `confirm` and `idempotencyKey` work.
- [Tokens and safety](/docs/tokens-and-safety): personal access tokens, scopes, API usage, rate limits, and the audit log.
