import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

import { renderStarterDocMarkdown } from '#/lib/starter-docs/markdown.server'

export const renderStarterDocMarkdownFn = createServerFn({ method: 'GET' })
  .validator(z.object({ body: z.string().max(512_000) }))
  .handler(async ({ data }) => renderStarterDocMarkdown(data.body))
