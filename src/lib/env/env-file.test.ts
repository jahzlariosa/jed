import { describe, expect, it } from 'vitest'

import { parseEnvFile, upsertEnvValues } from './env-file'
import { runSetupNotice, shouldShowSetupNotice } from './setup-notice'

describe('env file helpers', () => {
  it('updates keys without dropping comments or printing values', () => {
    const text =
      '# comment\nVITE_SUPABASE_URL=http://127.0.0.1:54321\nAPP_URL=\n'
    const next = upsertEnvValues(text, {
      APP_URL: 'http://localhost:3000',
      SUPABASE_JWT_SECRET: 'jwt secret #1',
    })
    expect(next).toContain('# comment')
    expect(parseEnvFile(next).APP_URL).toBe('http://localhost:3000')
    expect(parseEnvFile(next).SUPABASE_JWT_SECRET).toBe('jwt secret #1')
    expect(next.startsWith('# comment')).toBe(true)
  })
})

describe('setup notice', () => {
  it('stays quiet in CI, on Vercel, and without a terminal', () => {
    expect(shouldShowSetupNotice({ CI: 'true' }, true)).toBe(false)
    expect(shouldShowSetupNotice({ VERCEL: '1' }, true)).toBe(false)
    expect(shouldShowSetupNotice({ VERCEL_ENV: 'preview' }, true)).toBe(false)
    expect(shouldShowSetupNotice({}, false)).toBe(false)
  })

  it('names missing variables and never fails', async () => {
    const logs: string[] = []
    const result = await runSetupNotice({
      env: {},
      tty: true,
      readText: async () => 'VITE_SUPABASE_URL=http://127.0.0.1:54321\n',
      log: (message: string) => {
        logs.push(message)
      },
    })
    expect(result).toBe('shown')
    expect(logs[0]).toContain('npm run setup')
    expect(logs[0]).toContain('VITE_SUPABASE_PUBLISHABLE_KEY')
    expect(logs[0]).not.toContain('http://127.0.0.1:54321')

    const failed = await runSetupNotice({
      env: {},
      tty: true,
      readText: async () => {
        throw new Error('secret-disk-value')
      },
      log: (message: string) => {
        logs.push(message)
      },
    })
    expect(failed).toBe('error')
    expect(logs.join('\n')).not.toContain('secret-disk-value')
  })
})
