#!/usr/bin/env node
// Generates random values for the app's own secrets.
// Default: appends missing keys to .env.local and prints key names only.
// --print: prints KEY=value lines to paste into Vercel. Values are not written.
import { randomBytes } from 'node:crypto'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

export const GENERATED_SECRET_KEYS = [
  'CONTACT_IP_HASH_SECRET',
  'MEDIA_UPLOAD_TICKET_SECRET',
]

export function generateSecret() {
  return randomBytes(32).toString('base64url')
}

/** Keys from the list that have no non-empty value in the env file text. */
export function missingSecretKeys(envText, keys = GENERATED_SECRET_KEYS) {
  const present = new Set()
  for (const line of envText.split(/\r?\n/)) {
    const match = /^\s*(?:export\s+)?([A-Z0-9_]+)\s*=\s*(.*)$/.exec(line)
    if (match && match[2].trim() !== '' && match[2].trim() !== '""') {
      present.add(match[1])
    }
  }
  return keys.filter((key) => !present.has(key))
}

/** Sets missing keys, filling empty placeholders in place and appending the rest. */
export function addMissingSecrets(envText, keys, make = generateSecret) {
  const missing = missingSecretKeys(envText, keys)
  const pending = new Set(missing)
  const lines = envText === '' ? [] : envText.split(/\r?\n/)
  const out = lines.map((line) => {
    const match = /^\s*([A-Z0-9_]+)\s*=\s*(""|)\s*$/.exec(line)
    if (match && pending.has(match[1])) {
      pending.delete(match[1])
      return `${match[1]}=${make()}`
    }
    return line
  })
  while (out.length > 0 && out[out.length - 1] === '') {
    out.pop()
  }
  for (const key of pending) {
    out.push(`${key}=${make()}`)
  }
  return { text: `${out.join('\n')}\n`, added: missing }
}

function main(argv) {
  if (argv.includes('--print')) {
    console.error(
      'WARNING: the lines below are secret values. Paste them into Vercel and do not share or commit them.',
    )
    for (const key of GENERATED_SECRET_KEYS) {
      console.log(`${key}=${generateSecret()}`)
    }
    return
  }
  const file = resolve(process.cwd(), '.env.local')
  const current = existsSync(file) ? readFileSync(file, 'utf8') : ''
  const { text, added } = addMissingSecrets(current, GENERATED_SECRET_KEYS)
  if (added.length === 0) {
    console.log(
      '.env.local already has every generated secret. Nothing changed.',
    )
    return
  }
  writeFileSync(file, text)
  console.log(`Added to .env.local: ${added.join(', ')}`)
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  main(process.argv.slice(2))
}
