import { describe, expect, it } from 'vitest'

import { evaluateDoctor } from './doctor'

const secret = 'service-role-secret-value'

const env = {
  NODE_ENV: 'development',
  VITE_SUPABASE_URL: 'http://127.0.0.1:54321',
  VITE_SUPABASE_PUBLISHABLE_KEY: 'publishable-secret',
  APP_URL: 'http://localhost:3000',
  SUPABASE_SERVICE_ROLE_KEY: secret,
  SUPABASE_JWT_SECRET: 'jwt-secret',
  MEDIA_UPLOAD_TICKET_SECRET: 'm'.repeat(32),
  CONTACT_IP_HASH_SECRET: 'c'.repeat(32),
}

describe('evaluateDoctor', () => {
  it('passes when env, node, supabase, and the latest migration are ready', async () => {
    const report = await evaluateDoctor({
      nodeVersion: '22.14.0',
      minimumNode: '22.12.0',
      env,
      migrationFiles: ['20261017110000_latest.sql'],
      probe: async () => ({ reachable: true, keyAccepted: true }),
      readMigrations: async () => ({
        status: 'read',
        versions: ['20261017110000'],
      }),
    })
    expect(report.ok).toBe(true)
    expect(report.lines.join('\n')).toContain('20261017110000 is applied')
    expect(report.lines.join('\n')).not.toContain(secret)
    expect(report.lines.join('\n')).not.toContain('publishable-secret')
  })

  it('does not fail when the key cannot read migrations', async () => {
    const report = await evaluateDoctor({
      nodeVersion: '22.14.0',
      minimumNode: '22.12.0',
      env,
      migrationFiles: ['20261017110000_latest.sql'],
      probe: async () => ({ reachable: true, keyAccepted: true }),
      readMigrations: async () => ({ status: 'skipped' }),
    })
    expect(report.ok).toBe(true)
    expect(report.lines.join('\n')).toMatch(/cannot view them/)
  })

  it('fails when the latest migration is not applied or the key is rejected', async () => {
    const behind = await evaluateDoctor({
      nodeVersion: '22.11.0',
      minimumNode: '22.12.0',
      env,
      migrationFiles: ['20261017110000_latest.sql'],
      probe: async () => ({ reachable: true, keyAccepted: true }),
      readMigrations: async () => ({ status: 'read', versions: [] }),
    })
    expect(behind.ok).toBe(false)
    expect(behind.lines.join('\n')).toContain('older than 22.12.0')
    expect(behind.lines.join('\n')).toContain('20261017110000 is not applied')

    const rejected = await evaluateDoctor({
      nodeVersion: '22.14.0',
      minimumNode: '22.12.0',
      env,
      migrationFiles: ['20261017110000_latest.sql'],
      probe: async () => ({ reachable: true, keyAccepted: false }),
      readMigrations: async () => ({ status: 'skipped' }),
    })
    expect(rejected.ok).toBe(false)
    expect(rejected.lines.join('\n')).toContain('rejected the publishable key')
    expect(rejected.lines.join('\n')).not.toContain('publishable-secret')
  })
})
