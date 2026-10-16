---
title: Contact form
description: How the contact form saves messages, where to read them, and optional email alerts.
slug: /docs/contact
order: 8
---

# Contact form

The contact form lives at `/contact` and is on by default. Every message is saved to your database and shows up in **Admin > Inbox**. Email alerts are optional.

## How it works

1. A visitor fills in their name, email, and message.
2. The server checks the fields, the spam trap, and the rate limits.
3. The message is saved to the `contact_messages` table.
4. If email alerts are set up, a copy goes to your contact email.
5. The visitor sees "Message sent".

Visitors can't read or change the table. Only the server can add messages, and only admins can read them.

## Reading messages

Open **Admin > Inbox** (`/admin/inbox`). You need the `admin.access` permission.

- Tabs: **Inbox** (everything not archived), **Unread**, and **Archived**, each with a count.
- Search by name, email, or message. Messages are newest first, 25 per page by default.
- On wide screens the list and the open message sit side by side. On smaller screens the message opens in a dialog, or a sheet on phones.
- Opening a message marks it as read. The open message is kept in the address bar, so you can share or reload the link.
- **Archive**, **Mark unread**, and **Move to inbox** are in the message footer. Archiving shows an Undo option.
- **Reply by email** opens your email app with the subject "Re: Your message".
- Keyboard shortcuts: **E** archive or move to inbox, **U** mark unread, **R** reply, **Esc** close. Use the arrow keys to move through the list.

Status changes are recorded in the audit log.

## Email alerts (optional)

To also get an email for each message:

1. Set **Contact email** in **Admin > Settings**. Alerts go to this address.
2. Create an API key at [resend.com](https://resend.com) and verify your sending domain.
3. Add these to `.env.local` and to your Vercel project:

| Variable | Example |
|----------|---------|
| `RESEND_API_KEY` | Your Resend API key |
| `CONTACT_FROM_EMAIL` | `no-reply@example.com` (on your verified domain) |

Replies go straight to the visitor, because their address is set as reply-to. If the email fails to send, the message is still saved in the inbox.

## What the form asks for

| Field | Limit |
|-------|-------|
| Name | 120 characters |
| Email | Must be a valid address |
| Message | 4,000 characters |

## Spam protection

- **Hidden field**: bots that fill in a field people can't see get a normal success response, and nothing is saved.
- **Rate limits**: up to 5 messages per visitor per hour, tracked by a hashed IP address, plus a short-term limit of 8 attempts per 15 minutes. The IP comes from Vercel's own headers, and visitors without one share a single bucket, so the limit always applies.
- **IP hashing**: IPs are hashed with `CONTACT_IP_HASH_SECRET`. It is required in production; run `npm run secrets:generate` to create one. Raw IPs are never stored.

## Database setup

The table comes from the migration `20261016080000_contact_messages.sql`. Apply it with `npx supabase db push`, or copy it from [SQL templates](/docs/sql-templates).
