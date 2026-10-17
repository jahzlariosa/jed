import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const sql = readFileSync(
  join(import.meta.dirname, 'migrations/20261017105000_rate_limit_buckets.sql'),
  'utf8',
)

describe('rate_limit_buckets migration', () => {
  it('uses p_ parameters and expires_at cleanup', () => {
    expect(sql).toContain('p_bucket_key text')
    expect(sql).toContain('expires_at timestamptz not null')
    expect(sql).toContain('where b.expires_at < v_now')
    expect(sql).not.toContain('window_seconds * 2')
  })

  it('documents lack of live Postgres harness in CI', () => {
    expect(sql).toContain('rate-limit-buckets-migration.test.ts')
  })
})
