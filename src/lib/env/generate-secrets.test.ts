import { describe, expect, it } from 'vitest'

import {
  addMissingSecrets,
  GENERATED_SECRET_KEYS,
  generateSecret,
  missingSecretKeys,
} from '../../../scripts/generate-secrets.mjs'

describe('generate-secrets script', () => {
  it('lists the app secrets only, not Supabase or Resend keys', () => {
    expect(GENERATED_SECRET_KEYS).toContain('CONTACT_IP_HASH_SECRET')
    expect(GENERATED_SECRET_KEYS).toContain('MEDIA_UPLOAD_TICKET_SECRET')
    expect(GENERATED_SECRET_KEYS.join(' ')).not.toMatch(/SUPABASE|RESEND/)
  })

  it('makes long random values', () => {
    const a = generateSecret()
    expect(a.length).toBeGreaterThanOrEqual(40)
    expect(a).not.toBe(generateSecret())
  })

  it('keeps existing values and fills empty or absent keys', () => {
    const env =
      'A=1\nMEDIA_UPLOAD_TICKET_SECRET=keep\nCONTACT_IP_HASH_SECRET=\n'
    expect(missingSecretKeys(env)).toEqual(['CONTACT_IP_HASH_SECRET'])
    const result = addMissingSecrets(env, GENERATED_SECRET_KEYS, () => 'new')
    expect(result.added).toEqual(['CONTACT_IP_HASH_SECRET'])
    expect(result.text).toBe(
      'A=1\nMEDIA_UPLOAD_TICKET_SECRET=keep\nCONTACT_IP_HASH_SECRET=new\n',
    )
  })

  it('appends to an empty file', () => {
    const result = addMissingSecrets('', ['X_SECRET'], () => 'v')
    expect(result.text).toBe('X_SECRET=v\n')
  })
})
