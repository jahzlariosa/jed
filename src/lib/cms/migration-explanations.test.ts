import { readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

import { MIGRATION_EXPLANATIONS } from './migration-explanations'

describe('MIGRATION_EXPLANATIONS', () => {
  it('documents every SQL file in supabase/migrations', () => {
    const dir = join(process.cwd(), 'supabase/migrations')
    const files = readdirSync(dir)
      .filter((name) => name.endsWith('.sql'))
      .sort()
    const missing = files.filter((name) => !MIGRATION_EXPLANATIONS[name])
    expect(missing).toEqual([])
  })
})
