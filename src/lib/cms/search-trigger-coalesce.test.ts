import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const hotfixSql = readFileSync(
  join(
    process.cwd(),
    'supabase/migrations/20261015180000_search_triggers_and_admin_rpc_grants.sql',
  ),
  'utf8',
)

const coalesceFixSql = readFileSync(
  join(
    process.cwd(),
    'supabase/migrations/20261015191000_search_trigger_coalesce_fix.sql',
  ),
  'utf8',
)

describe('search trigger coalesce', () => {
  it('does not qualify coalesce under pg_catalog in bundled migrations', () => {
    expect(hotfixSql).not.toContain('pg_catalog.coalesce')
    expect(coalesceFixSql).not.toContain('pg_catalog.coalesce')
    expect(hotfixSql).toContain('coalesce(new.title')
    expect(coalesceFixSql).toContain('content_entries_search_document_update')
    expect(coalesceFixSql).toContain("set search_path = ''")
  })
})
