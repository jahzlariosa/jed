import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const sql = readFileSync(
  join(
    import.meta.dirname,
    'migrations/20261017110000_mfa_helper_grants_and_rate_limit_index.sql',
  ),
  'utf8',
)

describe('mfa_helper_grants migration', () => {
  it('revokes anon execute on MFA helper RPCs with exact signatures', () => {
    expect(sql).toContain(
      'revoke execute on function public.session_aal_is_aal2() from anon',
    )
    expect(sql).toContain(
      'revoke execute on function public.site_mfa_policy_row() from anon',
    )
    expect(sql).toContain(
      'revoke execute on function public.rls_requires_aal2_for_admin() from anon',
    )
    expect(sql).toContain(
      'revoke execute on function public.rls_requires_aal2_for_permission(text) from anon',
    )
  })

  it('indexes rate_limit_buckets expires_at', () => {
    expect(sql).toContain('rate_limit_buckets_expires_at_idx')
    expect(sql).toContain('private.rate_limit_buckets (expires_at)')
  })
})
