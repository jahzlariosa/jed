import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const MIGRATION = join(
  process.cwd(),
  'supabase/migrations/20261017100000_drop_set_user_role_atomic.sql',
)

describe('drop set_user_role_atomic migration', () => {
  it('drops the function idempotently', () => {
    const sql = readFileSync(MIGRATION, 'utf8')
    expect(sql).toContain('drop function if exists public.set_user_role_atomic')
    expect(sql).not.toContain('revoke')
  })
})
