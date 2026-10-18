import { createInterface } from 'node:readline/promises'
import { stdin, stdout } from 'node:process'
import {
  chmodSync,
  copyFileSync,
  existsSync,
  readFileSync,
  writeFileSync,
} from 'node:fs'
import { resolve } from 'node:path'

import {
  collectAppEnvIssues,
  formatAppEnvIssues,
  publishableKeyFromEnv,
  supabaseUrlMessage,
} from '../src/lib/env/schema.ts'
import { probeSupabase } from '../src/lib/env/supabase-probe.ts'
import { GENERATED_SECRET_KEYS, generateSecret } from './generate-secrets.mjs'
import { parseEnvFile, upsertEnvValues } from '../src/lib/env/env-file.ts'

const envPath = resolve(process.cwd(), '.env.local')
const examplePath = resolve(process.cwd(), '.env.example')

const PROMPTS = [
  {
    name: 'VITE_SUPABASE_URL',
    label: 'Supabase URL',
    secret: false,
  },
  {
    name: 'VITE_SUPABASE_PUBLISHABLE_KEY',
    label: 'Supabase publishable key',
    secret: true,
  },
  {
    name: 'APP_URL',
    label: 'App URL',
    secret: false,
    fallback: 'http://localhost:3000',
  },
  {
    name: 'SUPABASE_SERVICE_ROLE_KEY',
    label: 'Supabase service role key',
    secret: true,
  },
  {
    name: 'SUPABASE_JWT_SECRET',
    label: 'Supabase JWT secret',
    secret: true,
  },
]

function readText() {
  return existsSync(envPath) ? readFileSync(envPath, 'utf8') : ''
}

function chmodEnvFile() {
  try {
    chmodSync(envPath, 0o600)
  } catch {
    // Windows may reject chmod on existing files.
  }
}

function writeText(text) {
  writeFileSync(envPath, text, { mode: 0o600 })
  chmodEnvFile()
}

function ensureExampleCopy() {
  if (existsSync(envPath)) return
  if (!existsSync(examplePath)) {
    writeText('')
    return
  }
  copyFileSync(examplePath, envPath)
  chmodSync(envPath, 0o600)
}

function ensureGeneratedSecrets(text) {
  const current = parseEnvFile(text)
  const values = {}
  const added = []
  for (const key of GENERATED_SECRET_KEYS) {
    if ((current[key]?.trim().length ?? 0) >= 32) continue
    values[key] = generateSecret()
    added.push(key)
  }
  if (added.length === 0) return text
  const next = upsertEnvValues(text, values)
  writeText(next)
  console.log(`Generated ${added.join(', ')}`)
  return next
}

function readHidden() {
  return new Promise((resolveValue, reject) => {
    if (!stdin.isTTY) {
      reject(new Error('not a tty'))
      return
    }
    let value = ''
    stdin.setRawMode(true)
    stdin.resume()
    const cleanup = () => {
      stdin.off('data', onData)
      if (stdin.isTTY) stdin.setRawMode(false)
    }
    const finish = (next) => {
      cleanup()
      stdout.write('\n')
      resolveValue(next)
    }
    const onData = (chunk) => {
      const text = chunk.toString('utf8')
      if (text.includes('\u0003')) {
        cleanup()
        process.exit(130)
      }
      if (text.includes('\n') || text.includes('\r')) {
        const [first] = text.split(/\r?\n/)
        finish(value + (first ?? ''))
        return
      }
      if (text === '\u007f' || text === '\b') {
        value = value.slice(0, -1)
        return
      }
      if (text.startsWith('\u001b')) return
      const code = text.codePointAt(0)
      if (text.length === 1 && code !== undefined && code < 32) return
      value += text
    }
    stdin.on('data', onData)
  })
}

async function ask(prompt, current) {
  const saved = Boolean(current)
  if (prompt.secret) {
    const hint = saved ? ' (press enter to keep the saved value)' : ''
    stdout.write(`${prompt.label}${hint}: `)
    const entered = (await readHidden()).trim()
    return entered || current || ''
  }
  const shown = current || prompt.fallback || ''
  const hint = shown ? ` [${shown}]` : ''
  const rl = createInterface({ input: stdin, output: stdout })
  try {
    const entered = (await rl.question(`${prompt.label}${hint}: `)).trim()
    return entered || shown
  } finally {
    rl.close()
  }
}

async function promptAll(env) {
  const next = { ...env }
  for (const prompt of PROMPTS) {
    next[prompt.name] = await ask(prompt, next[prompt.name]?.trim() ?? '')
  }
  return next
}

async function promptMissing(env) {
  const next = { ...env }
  for (const prompt of PROMPTS) {
    const current = next[prompt.name]?.trim() ?? ''
    if (current) continue
    next[prompt.name] = await ask(prompt, '')
  }
  return next
}

async function reprompt(env, names) {
  const next = { ...env }
  for (const prompt of PROMPTS) {
    if (!names.has(prompt.name)) continue
    const replacement = await ask(prompt, '')
    if (replacement) next[prompt.name] = replacement
  }
  return next
}

function valuesToWrite(env) {
  const values = {}
  for (const prompt of PROMPTS) {
    const value = env[prompt.name]?.trim() ?? ''
    if (value) values[prompt.name] = value
  }
  return values
}

async function main() {
  const interactive = Boolean(stdin.isTTY && stdout.isTTY)
  ensureExampleCopy()
  let text = ensureGeneratedSecrets(readText())
  let env = {
    ...parseEnvFile(text),
    NODE_ENV: 'development',
  }

  if (!interactive) {
    const issues = collectAppEnvIssues(env)
    const key = publishableKeyFromEnv(env)
    const url = env.VITE_SUPABASE_URL?.trim() ?? ''
    if (issues.length > 0) {
      console.error(formatAppEnvIssues(issues))
      console.error('Run npm run setup in an interactive terminal.')
      process.exitCode = 1
      return
    }
    const probed = await probeSupabase(url, key ?? '')
    if (!probed.reachable) {
      console.error('Supabase could not be reached')
      process.exitCode = 1
      return
    }
    if (!probed.keyAccepted) {
      console.error('Supabase rejected the publishable key')
      process.exitCode = 1
      return
    }
    console.log('Supabase settings are ready.')
    return
  }

  for (let attempt = 0; attempt < 5; attempt += 1) {
    env = attempt === 0 ? await promptAll(env) : await promptMissing(env)
    const urlMessage = supabaseUrlMessage(env.VITE_SUPABASE_URL)
    if (urlMessage) {
      console.error(`VITE_SUPABASE_URL: ${urlMessage}`)
      env.VITE_SUPABASE_URL = ''
      continue
    }
    const issues = collectAppEnvIssues(env)
    if (issues.length > 0) {
      console.error(formatAppEnvIssues(issues))
      const fixable = issues.filter((issue) =>
        PROMPTS.some((prompt) => prompt.name === issue.name),
      )
      if (fixable.length === 0) {
        process.exitCode = 1
        return
      }
      env = await reprompt(env, new Set(fixable.map((issue) => issue.name)))
      continue
    }
    text = upsertEnvValues(readText(), valuesToWrite(env))
    writeText(text)
    const probed = await probeSupabase(
      env.VITE_SUPABASE_URL?.trim() ?? '',
      publishableKeyFromEnv(env) ?? '',
    )
    if (!probed.reachable) {
      console.error('Supabase could not be reached. Check VITE_SUPABASE_URL.')
      env.VITE_SUPABASE_URL = ''
      continue
    }
    if (!probed.keyAccepted) {
      console.error('Supabase rejected the publishable key.')
      env.VITE_SUPABASE_PUBLISHABLE_KEY = ''
      continue
    }
    console.log(
      'Saved .env.local. Next, link the Supabase project and push migrations, then run npm run dev and npm run doctor.',
    )
    return
  }
  console.error(
    'Setup stopped. Run npm run setup again when the values are ready.',
  )
  process.exitCode = 1
}

const isDirect = process.argv[1]?.endsWith('setup.mjs')
if (isDirect) {
  main().catch(() => {
    console.error('Setup could not finish.')
    process.exitCode = 1
  })
}
