import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const MIGRATION = join(
  process.cwd(),
  'supabase/migrations/20261016070000_admin_database_activity_coalesce_fix.sql',
)

describe('admin_database_activity coalesce fix migration', () => {
  it('uses plain coalesce for pg_stat_activity.state, not pg_catalog.coalesce', () => {
    const sql = readFileSync(MIGRATION, 'utf8')
    expect(sql).not.toMatch(/pg_catalog\.coalesce/)
    expect(sql).toContain("coalesce(sa.state, 'unknown')")
    expect(sql).toContain("group by coalesce(sa.state, 'unknown')")
    expect(sql).toContain('security definer')
    expect(sql).toContain("set search_path = ''")
    expect(sql).toContain(
      'grant execute on function public.admin_database_activity() to service_role',
    )
    expect(sql).toContain(
      'revoke execute on function public.admin_database_activity() from authenticated',
    )
  })
})
