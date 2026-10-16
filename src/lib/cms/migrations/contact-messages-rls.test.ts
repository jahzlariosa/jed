import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const MIGRATION = join(
  process.cwd(),
  'supabase/migrations/20261016080000_contact_messages.sql',
)

describe('contact_messages migration', () => {
  const sql = readFileSync(MIGRATION, 'utf8')

  it('enables RLS and gives anon nothing', () => {
    expect(sql).toContain(
      'alter table public.contact_messages enable row level security;',
    )
    expect(sql).toContain(
      'revoke all on table public.contact_messages from anon, authenticated;',
    )
    expect(sql).not.toMatch(/to anon/)
    expect(sql).not.toMatch(/for insert/)
  })

  it('lets admins read and change only the status', () => {
    expect(sql).toContain(
      'grant update (status) on table public.contact_messages to authenticated;',
    )
    expect(sql).toMatch(
      /contact_messages_admin_select[\s\S]*for select to authenticated[\s\S]*has_permission\('admin\.access'\)/,
    )
    expect(sql).toMatch(
      /contact_messages_admin_update[\s\S]*for update to authenticated[\s\S]*has_permission\('admin\.access'\)/,
    )
  })

  it('checks lengths and status values', () => {
    expect(sql).toContain('char_length(message) between 1 and 4000')
    expect(sql).toContain("status in ('new', 'read', 'archived')")
    expect(sql).toContain('contact_messages_created_at_idx')
  })
})
