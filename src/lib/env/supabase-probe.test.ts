import { describe, expect, it } from 'vitest'

import { probeSupabase, readAppliedMigrations } from './supabase-probe'

const key = 'publishable-secret-key'

function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status })
}

describe('probeSupabase', () => {
  it('accepts a key when settings returns ok', async () => {
    const result = await probeSupabase(
      'https://abc.supabase.co',
      key,
      async () => jsonResponse(200, { external: {} }),
    )
    expect(result).toEqual({ reachable: true, keyAccepted: true })
  })

  it('rejects a key without returning it', async () => {
    let sawKey = false
    const result = await probeSupabase(
      'https://abc.supabase.co',
      key,
      async (_url, init) => {
        const headers = new Headers(init?.headers)
        sawKey = headers.get('apikey') === key
        return jsonResponse(401, { message: 'Invalid API key', key })
      },
    )
    expect(sawKey).toBe(true)
    expect(result).toEqual({ reachable: true, keyAccepted: false })
    expect(JSON.stringify(result)).not.toContain(key)
  })

  it('reports an unreachable host', async () => {
    const result = await probeSupabase(
      'https://abc.supabase.co',
      key,
      async () => {
        throw new Error('offline')
      },
    )
    expect(result).toEqual({ reachable: false, keyAccepted: false })
  })
})

describe('readAppliedMigrations', () => {
  it('reads versions from a permitted key', async () => {
    const result = await readAppliedMigrations(
      'https://abc.supabase.co',
      ['service-secret', key],
      async () =>
        jsonResponse(200, [{ version: '20261017110000', name: 'mfa_helper' }]),
    )
    expect(result).toEqual({
      status: 'read',
      versions: ['20261017110000'],
    })
  })

  it('skips when the key cannot read migrations', async () => {
    const result = await readAppliedMigrations(
      'https://abc.supabase.co',
      [key],
      async () => jsonResponse(403, { message: 'forbidden', key }),
    )
    expect(result).toEqual({ status: 'skipped' })
    expect(JSON.stringify(result)).not.toContain(key)
  })
})
