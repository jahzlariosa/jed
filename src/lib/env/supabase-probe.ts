import { supabaseUrlMessage } from './schema.ts'

export type SupabaseProbe = {
  reachable: boolean
  keyAccepted: boolean
}

export type MigrationRead =
  | { status: 'read'; versions: string[] }
  | { status: 'skipped' }
  | { status: 'unreachable' }

const REQUEST_TIMEOUT_MS = 8_000

type FetchLike = typeof fetch

async function request(
  url: string,
  init: RequestInit,
  fetchImpl: FetchLike,
): Promise<Response | null> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  try {
    return await fetchImpl(url, {
      ...init,
      redirect: 'error',
      signal: controller.signal,
    })
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

/** Confirms the host answers and that Supabase accepts the publishable key. */
export async function probeSupabase(
  supabaseUrl: string,
  publishableKey: string,
  fetchImpl: FetchLike = fetch,
): Promise<SupabaseProbe> {
  if (supabaseUrlMessage(supabaseUrl) || !publishableKey.trim()) {
    return { reachable: false, keyAccepted: false }
  }
  const endpoint = new URL('/auth/v1/settings', supabaseUrl)
  const response = await request(
    endpoint.toString(),
    {
      method: 'GET',
      headers: {
        apikey: publishableKey,
        accept: 'application/json',
      },
    },
    fetchImpl,
  )
  if (!response) return { reachable: false, keyAccepted: false }
  return { reachable: true, keyAccepted: response.ok }
}

function isPermissionSkip(status: number, body: string): boolean {
  if (status === 401 || status === 403 || status === 404 || status === 406) {
    return true
  }
  return /forbidden|permission|42501|invalid api key/i.test(body)
}

async function readWithKey(
  supabaseUrl: string,
  key: string,
  fetchImpl: FetchLike,
): Promise<MigrationRead> {
  const endpoint = new URL(
    '/rest/v1/rpc/list_applied_schema_migrations',
    supabaseUrl,
  )
  const response = await request(
    endpoint.toString(),
    {
      method: 'POST',
      headers: {
        apikey: key,
        authorization: `Bearer ${key}`,
        accept: 'application/json',
        'content-type': 'application/json',
      },
      body: '{}',
    },
    fetchImpl,
  )
  if (!response) return { status: 'unreachable' }
  const body = await response.text()
  if (!response.ok || body.length > 100_000) {
    return isPermissionSkip(response.status, body.slice(0, 500))
      ? { status: 'skipped' }
      : { status: 'unreachable' }
  }
  let parsed: unknown
  try {
    parsed = JSON.parse(body)
  } catch {
    return { status: 'skipped' }
  }
  if (!Array.isArray(parsed)) return { status: 'skipped' }
  const versions: string[] = []
  for (const row of parsed) {
    if (!row || typeof row !== 'object' || !('version' in row)) {
      return { status: 'skipped' }
    }
    const version = (row as { version?: unknown }).version
    if (typeof version !== 'string' || !/^\d{14}$/.test(version)) {
      return { status: 'skipped' }
    }
    versions.push(version)
  }
  return { status: 'read', versions }
}

/**
 * Reads applied migration versions when the key is allowed to.
 * Permission failures are a skip, not a connection failure.
 */
export async function readAppliedMigrations(
  supabaseUrl: string,
  keys: readonly string[],
  fetchImpl: FetchLike = fetch,
): Promise<MigrationRead> {
  if (supabaseUrlMessage(supabaseUrl)) return { status: 'unreachable' }
  const unique = [...new Set(keys.map((key) => key.trim()).filter(Boolean))]
  if (unique.length === 0) return { status: 'skipped' }
  let sawUnreachable = false
  for (const key of unique) {
    const result = await readWithKey(supabaseUrl, key, fetchImpl)
    if (result.status === 'read') return result
    if (result.status === 'unreachable') sawUnreachable = true
  }
  return sawUnreachable ? { status: 'unreachable' } : { status: 'skipped' }
}
