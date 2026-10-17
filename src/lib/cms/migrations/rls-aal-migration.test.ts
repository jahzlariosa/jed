import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const MIGRATION = join(
  process.cwd(),
  'supabase/migrations/20261017101000_rls_mfa_aal2.sql',
)

describe('RLS MFA AAL2 migration', () => {
  it('requires aal2 in is_admin when site MFA requires step-up', () => {
    const sql = readFileSync(MIGRATION, 'utf8')
    expect(sql).toContain("auth.jwt()->>'aal'")
    expect(sql).toContain('create or replace function public.is_admin()')
    expect(sql).toContain('rls_requires_aal2_for_admin()')
    expect(sql).toContain('session_aal_is_aal2()')
    expect(sql).toContain('create or replace function public.has_permission(')
    expect(sql).toContain("set search_path = ''")
  })
})
