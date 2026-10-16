import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const accountFns = readFileSync(
  join(process.cwd(), 'src/lib/account/account-fns.ts'),
  'utf8',
)

describe('account profile selects', () => {
  it('does not request profiles.email (not granted to session clients)', () => {
    expect(accountFns).not.toMatch(
      /\.from\('profiles'\)[\s\S]*?\.select\([^)]*email/,
    )
  })
})
