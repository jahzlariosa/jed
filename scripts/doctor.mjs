import { readdirSync, readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

import { evaluateDoctor } from '../src/lib/env/doctor.ts'
import { parseEnvFile } from '../src/lib/env/env-file.ts'

function loadEnv() {
  const file = resolve(process.cwd(), '.env.local')
  const fromFile = existsSync(file)
    ? parseEnvFile(readFileSync(file, 'utf8'))
    : {}
  const merged = { ...fromFile }
  for (const [key, value] of Object.entries(process.env)) {
    if (typeof value === 'string' && value.length > 0) merged[key] = value
  }
  if (!merged.NODE_ENV) merged.NODE_ENV = 'development'
  return merged
}

function minimumNode() {
  try {
    const pkg = JSON.parse(
      readFileSync(resolve(process.cwd(), 'package.json'), 'utf8'),
    )
    const engines = pkg.engines?.node
    if (typeof engines === 'string') {
      const match = /(\d+\.\d+\.\d+)/.exec(engines)
      if (match) return match[1]
    }
  } catch {
    // Fall through to the project minimum.
  }
  return '22.12.0'
}

function migrationFiles() {
  const dir = resolve(process.cwd(), 'supabase/migrations')
  try {
    return readdirSync(dir)
  } catch {
    return []
  }
}

export async function runDoctor() {
  const report = await evaluateDoctor({
    nodeVersion: process.versions.node,
    minimumNode: minimumNode(),
    env: loadEnv(),
    migrationFiles: migrationFiles(),
  })
  for (const line of report.lines) console.log(line)
  return report.ok ? 0 : 1
}

const isDirect = process.argv[1]?.endsWith('doctor.mjs')
if (isDirect) {
  runDoctor()
    .then((code) => {
      process.exitCode = code
    })
    .catch(() => {
      console.error('Doctor could not finish.')
      process.exitCode = 1
    })
}
