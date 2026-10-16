import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const MIGRATION = join(
  process.cwd(),
  'supabase/migrations/20261016050000_admin_role_catalog_advisory_lock.sql',
)

const LOCK_LINE =
  "perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext('admin_role_catalog'));"

describe('admin role catalog advisory lock migration', () => {
  it('adds the same transaction lock to both catalog RPCs', () => {
    const sql = readFileSync(MIGRATION, 'utf8')
    const matches = sql.match(
      /pg_advisory_xact_lock\(pg_catalog\.hashtext\('admin_role_catalog'\)\)/g,
    )
    expect(matches).toHaveLength(2)
    expect(sql).toContain(
      'create or replace function public.admin_update_role_catalog',
    )
    expect(sql).toContain(
      'create or replace function public.admin_delete_role_catalog',
    )
    expect(sql).toContain(LOCK_LINE)
    expect(sql).toContain(
      'grant execute on function public.admin_update_role_catalog(uuid, text, text, text, text[]) to service_role',
    )
    expect(sql).toContain(
      'grant execute on function public.admin_delete_role_catalog(uuid, text, text) to service_role',
    )
  })
})
