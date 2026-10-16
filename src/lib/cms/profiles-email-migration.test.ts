import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const sql = readFileSync(
  join(
    process.cwd(),
    'supabase/migrations/20261015182200_profiles_email_visibility.sql',
  ),
  'utf8',
)

describe('profiles email visibility migration', () => {
  it('drops profiles_select_all and limits column grants', () => {
    expect(sql).toContain('drop policy if exists profiles_select_all')
    expect(sql).toContain('profiles_select_bylines')
    expect(sql).toContain(
      'revoke select on table public.profiles from authenticated',
    )
    expect(sql).not.toContain(
      'grant select on table public.profiles to authenticated',
    )
    expect(sql).toContain('profile_bylines')
  })
})
