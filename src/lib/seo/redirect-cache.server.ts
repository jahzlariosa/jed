import '@tanstack/react-start/server-only'

import { createServiceRoleClient } from '#/lib/supabase/service-role.server'

export type CachedRedirect = {
  toPath: string
  statusCode: 301 | 302 | 410
  isExternal: boolean
}

type RedirectCacheState = {
  redirects: Map<string, CachedRedirect>
  externalHosts: string[]
  loadedAt: number
}

/** In-memory per instance; cleared on redirect save (may lag up to TTL_MS across instances). */
let cache: RedirectCacheState | null = null
const TTL_MS = 10_000

export function clearRedirectCache(): void {
  cache = null
}

function parseHostList(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return []
  }
  return value.filter((item): item is string => typeof item === 'string')
}

async function loadRedirectState(): Promise<RedirectCacheState> {
  const now = Date.now()
  if (cache && now - cache.loadedAt < TTL_MS) {
    return cache
  }
  const supabase = createServiceRoleClient()
  const [{ data: redirects, error }, { data: settings, error: settingsError }] =
    await Promise.all([
      supabase
        .from('url_redirects')
        .select('from_path, to_path, status_code, is_external')
        .eq('enabled', true),
      supabase
        .from('site_settings')
        .select('redirect_external_hosts')
        .eq('id', 1)
        .maybeSingle(),
    ])
  if (error) {
    console.error(error)
    return (
      cache ?? {
        redirects: new Map(),
        externalHosts: [],
        loadedAt: now,
      }
    )
  }
  if (settingsError) {
    console.error(settingsError)
  }
  const map = new Map<string, CachedRedirect>()
  for (const row of redirects ?? []) {
    const code = row.status_code
    if (code !== 301 && code !== 302 && code !== 410) {
      continue
    }
    map.set(row.from_path, {
      toPath: row.to_path,
      statusCode: code,
      isExternal: row.is_external === true,
    })
  }
  cache = {
    redirects: map,
    externalHosts: parseHostList(settings?.redirect_external_hosts),
    loadedAt: now,
  }
  return cache
}

export async function lookupCachedRedirect(
  pathname: string,
): Promise<CachedRedirect | null> {
  const state = await loadRedirectState()
  return state.redirects.get(pathname) ?? null
}

export async function getCachedRedirectExternalHosts(): Promise<string[]> {
  const state = await loadRedirectState()
  return state.externalHosts
}
