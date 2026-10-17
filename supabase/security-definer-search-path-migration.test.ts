import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const sql = readFileSync(
  join(
    import.meta.dirname,
    'migrations/20261017103000_security_definer_search_path.sql',
  ),
  'utf8',
)

describe('security_definer_search_path migration', () => {
  it('does not schema-qualify SQL keyword builtins', () => {
    expect(sql).not.toMatch(/pg_catalog\.coalesce/i)
    expect(sql).not.toMatch(/pg_catalog\.nullif/i)
    expect(sql).not.toMatch(/pg_catalog\.greatest/i)
    expect(sql).not.toMatch(/pg_catalog\.least/i)
  })

  it('keeps search_path pinned and qualifies real functions', () => {
    expect(sql).toContain("set search_path = ''")
    expect(sql).toContain('pg_catalog.websearch_to_tsquery')
    expect(sql).toContain('from public.posts')
  })
})
