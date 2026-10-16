import type { z } from 'zod'

import type { AccessDto } from '#/auth/permissions'
import type { Permission } from '#/auth/permissions'
import type { RequestSupabase } from '#/auth/session.server'
import type { AppUser } from '#/auth/user'

export type DomainContext = {
  user: AppUser | null
  access: AccessDto | null
  supabase: RequestSupabase
  apiTokenId: string | null
}

export type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'

export type DomainScopes = Permission[] | 'public' | 'authenticated'

export type DomainOperation<I, O> = {
  id: string
  method: HttpMethod
  path: string
  mcpToolName: string
  summary: string
  scopes: DomainScopes
  inputSchema: z.ZodType<I>
  mcpInputSchema: z.ZodType<I>
  outputSchema: z.ZodType<O>
  destructive?: boolean
  handler: (ctx: DomainContext, input: I) => Promise<O>
}
