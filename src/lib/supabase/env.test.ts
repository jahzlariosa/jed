import { describe, expect, it } from 'vitest'

import { readPublicSupabaseConfig } from './env'

describe('readPublicSupabaseConfig', () => {
  it('reads VITE_SUPABASE_PUBLISHABLE_KEY first', () => {
    expect(
      readPublicSupabaseConfig({
        VITE_SUPABASE_URL: 'https://abc.supabase.co',
        VITE_SUPABASE_PUBLISHABLE_KEY: 'publishable',
        VITE_SUPABASE_KEY: 'legacy',
      }),
    ).toEqual({
      url: 'https://abc.supabase.co',
      publishableKey: 'publishable',
    })
  })

  it('falls back to legacy VITE_SUPABASE_ANON_KEY', () => {
    expect(
      readPublicSupabaseConfig({
        VITE_SUPABASE_URL: 'https://abc.supabase.co',
        VITE_SUPABASE_ANON_KEY: 'legacy-anon',
      }),
    ).toEqual({
      url: 'https://abc.supabase.co',
      publishableKey: 'legacy-anon',
    })
  })

  it('falls back to legacy VITE_SUPABASE_KEY', () => {
    expect(
      readPublicSupabaseConfig({
        VITE_SUPABASE_URL: 'https://abc.supabase.co',
        VITE_SUPABASE_KEY: 'legacy-anon',
      }),
    ).toEqual({
      url: 'https://abc.supabase.co',
      publishableKey: 'legacy-anon',
    })
  })

  it('throws when url or key is missing', () => {
    expect(() =>
      readPublicSupabaseConfig({
        VITE_SUPABASE_URL: 'https://abc.supabase.co',
      }),
    ).toThrow(/publishable key/)
  })
})
