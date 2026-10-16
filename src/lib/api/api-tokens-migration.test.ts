import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const sql = readFileSync(
  join(process.cwd(), 'supabase/migrations/20261015182000_api_tokens.sql'),
  'utf8',
)

describe('api tokens migration', () => {
  it('defines RLS, revoke anon, and lookup RPC', () => {
    expect(sql).toContain('api_tokens')
    expect(sql).toContain('api_idempotency')
    expect(sql).toContain('grant select (')
    expect(sql).not.toMatch(
      /grant select, insert, update on table public\.api_tokens/,
    )
    expect(sql).toContain('lookup_api_token_by_hash')
    expect(sql).toContain("set search_path = ''")
    expect(sql).toContain('revoke all on table public.api_tokens from anon')
    expect(sql).toContain(
      'grant execute on function public.lookup_api_token_by_hash',
    )
  })
})
