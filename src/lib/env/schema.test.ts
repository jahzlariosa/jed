import { describe, expect, it } from 'vitest'

import {
  appEnvSchema,
  assertAppEnvAtStartup,
  collectAppEnvIssues,
  compareNodeVersion,
  formatAppEnvIssues,
  latestMigrationVersion,
  supabaseUrlMessage,
} from './schema'

const secret = 'super-secret-service-role-value'

function validEnv(
  overrides: Record<string, string | undefined> = {},
): Record<string, string | undefined> {
  return {
    NODE_ENV: 'development',
    VITE_SUPABASE_URL: 'http://127.0.0.1:54321',
    VITE_SUPABASE_PUBLISHABLE_KEY: 'publishable-key',
    APP_URL: 'http://localhost:3000',
    SUPABASE_SERVICE_ROLE_KEY: secret,
    SUPABASE_JWT_SECRET: 'jwt-secret-value',
    MEDIA_UPLOAD_TICKET_SECRET: 'm'.repeat(32),
    CONTACT_IP_HASH_SECRET: 'c'.repeat(32),
    VITE_AUTH_GOOGLE_ENABLED: 'false',
    ...overrides,
  }
}

describe('appEnvSchema', () => {
  it('accepts a complete local environment', () => {
    expect(appEnvSchema.safeParse(validEnv()).success).toBe(true)
    expect(collectAppEnvIssues(validEnv())).toEqual([])
  })

  it('accepts a legacy publishable key alias', () => {
    const env = validEnv({
      VITE_SUPABASE_PUBLISHABLE_KEY: undefined,
      VITE_SUPABASE_ANON_KEY: 'legacy-anon',
    })
    expect(collectAppEnvIssues(env)).toEqual([])
  })

  it('lists each missing variable by name and omits values', () => {
    const issues = collectAppEnvIssues({
      NODE_ENV: 'production',
      VITE_SUPABASE_URL: 'http://db.internal/secret-path',
      APP_URL: 'http://app.example/with-secret',
      SUPABASE_SERVICE_ROLE_KEY: 'short',
      MEDIA_UPLOAD_TICKET_SECRET: 'tiny',
    })
    const text = formatAppEnvIssues(issues)
    expect(text).toContain('VITE_SUPABASE_URL:')
    expect(text).toContain('VITE_SUPABASE_PUBLISHABLE_KEY:')
    expect(text).toContain('APP_URL:')
    expect(text).toContain('SUPABASE_JWT_SECRET:')
    expect(text).toContain('CONTACT_IP_HASH_SECRET:')
    expect(text).not.toContain(secret)
    expect(text).not.toContain('secret-path')
    expect(text).not.toContain('with-secret')
    expect(text).not.toContain('short')
    expect(text).not.toContain('tiny')
    const parsed = appEnvSchema.safeParse({
      ...validEnv(),
      VITE_SUPABASE_URL: 'not a url',
      SUPABASE_SERVICE_ROLE_KEY: secret,
    })
    expect(parsed.success).toBe(false)
    if (!parsed.success) {
      expect(JSON.stringify(parsed.error.issues)).not.toContain(secret)
      expect(JSON.stringify(parsed.error.issues)).not.toContain('not a url')
    }
  })

  it('allows a Vercel preview build without APP_URL', () => {
    const env = validEnv({
      NODE_ENV: 'production',
      VITE_SUPABASE_URL: 'https://abc.supabase.co',
      APP_URL: undefined,
      VERCEL_ENV: 'preview',
      VERCEL_URL: 'jed-preview.vercel.app',
    })
    expect(collectAppEnvIssues(env)).toEqual([])
  })

  it('rejects http app origins in production', () => {
    const issues = collectAppEnvIssues(
      validEnv({
        NODE_ENV: 'production',
        VITE_SUPABASE_URL: 'https://abc.supabase.co',
        APP_URL: 'http://app.example',
      }),
    )
    expect(issues.some((issue) => issue.name === 'APP_URL')).toBe(true)
    expect(JSON.stringify(issues)).not.toContain('app.example')
  })
})

describe('supabaseUrlMessage', () => {
  it('rejects credentials without echoing them', () => {
    const message = supabaseUrlMessage('https://user:secret-pass@example.com')
    expect(message).toMatch(/username or password/)
    expect(message).not.toContain('secret-pass')
  })
})

describe('assertAppEnvAtStartup', () => {
  it('throws on build and only logs during dev', () => {
    const issues = collectAppEnvIssues({})
    const logged: string[] = []
    assertAppEnvAtStartup('serve', issues, (message) => {
      logged.push(message)
    })
    expect(logged).toHaveLength(1)
    expect(() => assertAppEnvAtStartup('build', issues, () => {})).toThrow(
      /VITE_SUPABASE_URL/,
    )
  })
})

describe('compareNodeVersion', () => {
  it('compares the project minimum', () => {
    expect(compareNodeVersion('22.12.0', '22.12.0')).toBe(0)
    expect(compareNodeVersion('v22.14.0', '22.12.0')).toBeGreaterThan(0)
    expect(compareNodeVersion('22.11.9', '22.12.0')).toBeLessThan(0)
  })
})

describe('latestMigrationVersion', () => {
  it('returns the newest timestamped file', () => {
    expect(
      latestMigrationVersion([
        '20261015161000_admin_schema_migrations_rpc.sql',
        'readme.md',
        '20261017110000_mfa_helper_grants_and_rate_limit_index.sql',
      ]),
    ).toBe('20261017110000')
  })
})
