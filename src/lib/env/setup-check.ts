import {
  collectAppEnvIssues,
  publishableKeyFromEnv,
  type EnvIssue,
  type EnvSource,
} from './schema.ts'
import { probeSupabase, type SupabaseProbe } from './supabase-probe.ts'

export type SetupStatus = {
  ok: boolean
  items: EnvIssue[]
}

export async function loadSetupStatus(
  env: EnvSource,
  probe: (url: string, key: string) => Promise<SupabaseProbe> = probeSupabase,
): Promise<SetupStatus> {
  if (env.NODE_ENV === 'production') {
    return { ok: true, items: [] }
  }
  const items = collectAppEnvIssues({
    ...env,
    NODE_ENV: env.NODE_ENV ?? 'development',
  })
  const url = env.VITE_SUPABASE_URL?.trim() ?? ''
  const key = publishableKeyFromEnv(env) ?? ''
  const blocked = items.some(
    (item) =>
      item.name === 'VITE_SUPABASE_URL' ||
      item.name === 'VITE_SUPABASE_PUBLISHABLE_KEY',
  )
  if (!blocked && url && key) {
    const result = await probe(url, key)
    if (!result.reachable) {
      items.push({
        name: 'VITE_SUPABASE_URL',
        message: 'Could not reach Supabase',
      })
    } else if (!result.keyAccepted) {
      items.push({
        name: 'VITE_SUPABASE_PUBLISHABLE_KEY',
        message: 'Supabase rejected this key',
      })
    }
  }
  return { ok: items.length === 0, items }
}
