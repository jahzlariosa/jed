type PublicSupabaseEnv = {
  VITE_SUPABASE_URL?: string
  VITE_SUPABASE_PUBLISHABLE_KEY?: string
  /** Legacy Vercel / Supabase dashboard name */
  VITE_SUPABASE_ANON_KEY?: string
  /** Legacy alias used by some deployments */
  VITE_SUPABASE_KEY?: string
}

function firstNonEmpty(...values: Array<string | undefined>) {
  for (const value of values) {
    const trimmed = value?.trim()
    if (trimmed) {
      return trimmed
    }
  }
  return undefined
}

export function readPublicSupabaseConfig(source: PublicSupabaseEnv) {
  const url = source.VITE_SUPABASE_URL?.trim()
  const publishableKey = firstNonEmpty(
    source.VITE_SUPABASE_PUBLISHABLE_KEY,
    source.VITE_SUPABASE_ANON_KEY,
    source.VITE_SUPABASE_KEY,
  )

  if (!url || !publishableKey) {
    throw new Error(
      'Missing VITE_SUPABASE_URL or a publishable key (VITE_SUPABASE_PUBLISHABLE_KEY, VITE_SUPABASE_ANON_KEY, or VITE_SUPABASE_KEY)',
    )
  }

  return { url, publishableKey }
}

export function getBrowserSupabaseConfig() {
  return readPublicSupabaseConfig(import.meta.env)
}

export function getServerSupabaseConfig() {
  return readPublicSupabaseConfig(process.env)
}
