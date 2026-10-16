import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const sql = readFileSync(
  join(import.meta.dirname, 'migrations/20261014230000_grant_hygiene.sql'),
  'utf8',
)

describe('grant hygiene migration', () => {
  it('revokes anon and authenticated before granting', () => {
    expect(sql).toContain('revoke all on table public.posts from anon')
    expect(sql).toContain('revoke all on table public.posts from authenticated')
    expect(sql).toContain('grant select on table public.posts to anon')
    expect(sql).toContain(
      'grant select, insert, update, delete on table public.posts to authenticated',
    )
  })

  it('keeps public RPC execute for redirects and auth settings', () => {
    expect(sql).toContain(
      'grant execute on function public.lookup_url_redirect(text) to anon',
    )
    expect(sql).toContain(
      'grant execute on function public.get_site_auth_redirects() to anon',
    )
  })

  it('grants admin redirect and audit tables to authenticated', () => {
    expect(sql).toContain(
      'grant select, insert, update, delete on table public.url_redirects to authenticated',
    )
    expect(sql).toContain(
      'grant select, insert on table public.audit_log to authenticated',
    )
  })
})
