import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const sql = readFileSync(
  join(
    process.cwd(),
    'supabase/migrations/20261015180000_search_triggers_and_admin_rpc_grants.sql',
  ),
  'utf8',
)

describe('search triggers and admin RPC grants migration', () => {
  it('revokes anon on list_applied_schema_migrations', () => {
    expect(sql).toContain(
      'revoke execute on function public.list_applied_schema_migrations() from anon',
    )
  })

  it('sets empty search_path and qualifies catalog functions', () => {
    expect(sql).toContain("set search_path = ''")
    expect(sql).toContain('pg_catalog.to_tsvector')
    expect(sql).toContain('pg_catalog.setweight')
    expect(sql).not.toContain('pg_catalog.coalesce')
    expect(sql).toContain('posts_search_document_update')
    expect(sql).toContain('content_entries_search_document_update')
  })
})
