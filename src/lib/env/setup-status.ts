import { createServerFn } from '@tanstack/react-start'

import { markPrivateNoStore } from '#/auth/session.server'

import { loadSetupStatus, type SetupStatus } from './setup-check.ts'

const CACHE_MS = 60_000

let cache: { at: number; status: SetupStatus } | null = null

export const getSetupStatusFn = createServerFn({ method: 'GET' }).handler(
  async (): Promise<SetupStatus> => {
    markPrivateNoStore()
    if (process.env.NODE_ENV === 'production') {
      return { ok: true, items: [] }
    }
    const now = Date.now()
    if (cache && now - cache.at < CACHE_MS) return cache.status
    const status = await loadSetupStatus(process.env)
    cache = { at: now, status }
    return status
  },
)
