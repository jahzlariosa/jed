import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const sql = readFileSync(
  join(
    import.meta.dirname,
    'migrations/20261017104000_public_default_privileges.sql',
  ),
  'utf8',
)

describe('public default privileges migration', () => {
  it('revokes default privileges for postgres only', () => {
    expect(sql).toContain(
      'alter default privileges for role postgres in schema public',
    )
    expect(sql).not.toContain('supabase_admin')
    expect(sql).toContain('revoke all on tables from anon, authenticated')
    expect(sql).toContain('revoke execute on functions from public')
  })

  it('grants column-limited profiles select without email', () => {
    expect(sql).not.toMatch(
      /grant select on table public\.profiles to authenticated/,
    )
    expect(sql).toContain(
      'grant select (user_id, display_name, avatar_url, created_at, updated_at)',
    )
    expect(sql).not.toMatch(/grant select.*email/i)
    expect(sql).not.toMatch(/grant select on table public\.profiles to anon/)
  })

  it('re-grants explicit api and contact access', () => {
    expect(sql).toContain('grant select on table public.contact_messages')
    expect(sql).toContain(
      'grant execute on function public.list_my_api_token_usage()',
    )
  })
})
