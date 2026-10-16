import { z } from 'zod'

import { safeInternalPath } from './path'

export const authCallbackSearchSchema = z.object({
  code: z.string().min(1).optional(),
  next: z.string().optional(),
  type: z.string().optional(),
  error: z.string().optional(),
  error_description: z.string().optional(),
})

export function defaultAuthNext(params: {
  type?: string | null
  next?: string | null
}) {
  if (params.type === 'recovery') {
    return '/reset-password'
  }
  const fromNext = params.next ? safeInternalPath(params.next) : null
  if (fromNext) {
    return fromNext
  }
  return ''
}

export function buildAuthCallbackHref(search: URLSearchParams) {
  const code = search.get('code')
  const error = search.get('error')
  if (!code && !error) {
    return null
  }
  const params = new URLSearchParams()
  if (code) {
    params.set('code', code)
  }
  if (error) {
    params.set('error', error)
  }
  const description = search.get('error_description')
  if (description) {
    params.set('error_description', description)
  }
  const type = search.get('type')
  if (type) {
    params.set('type', type)
  }
  const next =
    search.get('next') ?? defaultAuthNext({ type, next: search.get('next') })
  if (next) {
    params.set('next', next)
  }
  return `/auth/callback?${params.toString()}`
}
