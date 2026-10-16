import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const MIGRATION = join(
  process.cwd(),
  'supabase/migrations/20261016060000_admin_set_user_role_and_catalog_lock.sql',
)

const LOCK_LINE =
  "perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext('admin_role_catalog'));"

describe('admin_set_user_role migration', () => {
  it('defines admin_set_user_role with advisory lock and service_role grants only', () => {
    const sql = readFileSync(MIGRATION, 'utf8')
    expect(sql).not.toContain('admin_update_role_catalog')
    expect(sql).not.toContain('admin_delete_role_catalog')
    expect(sql).toContain(
      'create or replace function public.admin_set_user_role',
    )
    expect(sql).toContain(LOCK_LINE)
    expect(sql).toContain('on conflict (user_id, role_code) do nothing')
    expect(sql).toContain("rp.permission_code = 'admin.access'")
    expect(sql).toContain(
      'grant execute on function public.admin_set_user_role(uuid, uuid, text) to service_role',
    )
    expect(sql).toContain(
      'revoke execute on function public.admin_set_user_role(uuid, uuid, text) from authenticated',
    )
  })
})
