import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const sql = readFileSync(
  join(
    process.cwd(),
    'supabase/migrations/20261015170000_profiles_avatars.sql',
  ),
  'utf8',
)

describe('profiles avatars migration', () => {
  it('defines avatar_url and avatars bucket RLS', () => {
    expect(sql).toContain('avatar_url')
    expect(sql).toContain("'avatars'")
    expect(sql).toContain('avatars_public_read')
    expect(sql).toContain('avatars_owner_insert')
    expect(sql).toContain('storage.foldername(name)')
    expect(sql).toContain('profiles_update_own_fields')
  })
})
