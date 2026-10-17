import { z } from 'zod'

import { resolveAppUrl } from '../app-url.ts'

export type EnvSource = Record<string, string | undefined>

export type EnvIssue = {
  name: string
  message: string
}

const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]', '::1'])

const PUBLISHABLE_KEY_NAMES = [
  'VITE_SUPABASE_PUBLISHABLE_KEY',
  'VITE_SUPABASE_ANON_KEY',
  'VITE_SUPABASE_KEY',
] as const

export const appEnvObjectSchema = z
  .object({
    NODE_ENV: z.string().optional(),
    VERCEL_ENV: z.string().optional(),
    VERCEL_URL: z.string().optional(),
    VITE_SUPABASE_URL: z.string().optional(),
    VITE_SUPABASE_PUBLISHABLE_KEY: z.string().optional(),
    VITE_SUPABASE_ANON_KEY: z.string().optional(),
    VITE_SUPABASE_KEY: z.string().optional(),
    VITE_AUTH_GOOGLE_ENABLED: z.string().optional(),
    APP_URL: z.string().optional(),
    SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
    SUPABASE_JWT_SECRET: z.string().optional(),
    MEDIA_UPLOAD_TICKET_SECRET: z.string().optional(),
    CONTACT_IP_HASH_SECRET: z.string().optional(),
    RESEND_API_KEY: z.string().optional(),
    CONTACT_FROM_EMAIL: z.string().optional(),
  })
  .strip()

export const appEnvSchema = appEnvObjectSchema.superRefine((value, ctx) => {
  for (const issue of collectAppEnvIssues(value)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: [issue.name],
      message: issue.message,
    })
  }
})

export function publishableKeyFromEnv(env: EnvSource): string | undefined {
  for (const name of PUBLISHABLE_KEY_NAMES) {
    const value = env[name]?.trim()
    if (value) return value
  }
  return undefined
}

export function supabaseUrlMessage(value: string | undefined): string | null {
  const trimmed = value?.trim() ?? ''
  if (!trimmed) return 'Required'
  let url: URL
  try {
    url = new URL(trimmed)
  } catch {
    return 'Must be an absolute http or https URL'
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return 'Must use http or https'
  }
  if (url.username || url.password) {
    return 'Must not include a username or password'
  }
  if (!url.hostname) return 'Must include a host'
  if (url.protocol === 'http:' && !LOOPBACK_HOSTS.has(url.hostname)) {
    return 'Must use https except on localhost'
  }
  return null
}

function appUrlMessage(env: EnvSource): string | null {
  const explicit = env.APP_URL?.trim() ?? ''
  if (!explicit) {
    if (env.VERCEL_ENV === 'preview' && env.VERCEL_URL?.trim()) return null
    return 'Required'
  }
  try {
    resolveAppUrl({
      APP_URL: explicit,
      NODE_ENV: env.NODE_ENV,
      VERCEL_ENV: env.VERCEL_ENV,
      VERCEL_URL: env.VERCEL_URL,
    })
    return null
  } catch (error) {
    if (error instanceof Error && !error.message.includes(explicit)) {
      return error.message
    }
    return 'Must be an absolute http or https origin'
  }
}

function requiredSecretMessage(
  value: string | undefined,
  minimum: number,
): string | null {
  const trimmed = value?.trim() ?? ''
  if (!trimmed) return 'Required'
  if (trimmed.length < minimum) {
    return `Must be at least ${minimum} characters`
  }
  return null
}

function googleMessage(value: string | undefined): string | null {
  const trimmed = value?.trim() ?? ''
  if (!trimmed || trimmed === 'true' || trimmed === 'false') return null
  return 'Must be true or false'
}

function emailMessage(value: string | undefined): string | null {
  const trimmed = value?.trim() ?? ''
  if (!trimmed) return null
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return null
  return 'Must be an email address'
}

function addIssue(
  issues: EnvIssue[],
  name: string,
  message: string | null,
): void {
  if (!message) return
  if (issues.some((issue) => issue.name === name)) return
  issues.push({ name, message })
}

/** Names and safe messages only. Never includes the variable value. */
export function collectAppEnvIssues(env: EnvSource): EnvIssue[] {
  const issues: EnvIssue[] = []
  addIssue(
    issues,
    'VITE_SUPABASE_URL',
    supabaseUrlMessage(env.VITE_SUPABASE_URL),
  )
  if (!publishableKeyFromEnv(env)) {
    addIssue(issues, 'VITE_SUPABASE_PUBLISHABLE_KEY', 'Required')
  }
  addIssue(issues, 'APP_URL', appUrlMessage(env))
  addIssue(
    issues,
    'SUPABASE_SERVICE_ROLE_KEY',
    requiredSecretMessage(env.SUPABASE_SERVICE_ROLE_KEY, 1),
  )
  addIssue(
    issues,
    'SUPABASE_JWT_SECRET',
    requiredSecretMessage(env.SUPABASE_JWT_SECRET, 1),
  )
  addIssue(
    issues,
    'MEDIA_UPLOAD_TICKET_SECRET',
    requiredSecretMessage(env.MEDIA_UPLOAD_TICKET_SECRET, 32),
  )
  addIssue(
    issues,
    'CONTACT_IP_HASH_SECRET',
    requiredSecretMessage(env.CONTACT_IP_HASH_SECRET, 32),
  )
  addIssue(
    issues,
    'VITE_AUTH_GOOGLE_ENABLED',
    googleMessage(env.VITE_AUTH_GOOGLE_ENABLED),
  )
  const resend = env.RESEND_API_KEY?.trim() ?? ''
  const fromEmail = env.CONTACT_FROM_EMAIL?.trim() ?? ''
  if (resend && !fromEmail) {
    addIssue(
      issues,
      'CONTACT_FROM_EMAIL',
      'Required when RESEND_API_KEY is set',
    )
  } else {
    addIssue(issues, 'CONTACT_FROM_EMAIL', emailMessage(env.CONTACT_FROM_EMAIL))
  }
  if (fromEmail && !resend) {
    addIssue(
      issues,
      'RESEND_API_KEY',
      'Required when CONTACT_FROM_EMAIL is set',
    )
  }
  return issues
}

export function formatAppEnvIssues(issues: readonly EnvIssue[]): string {
  const lines = issues.map((issue) => `- ${issue.name}: ${issue.message}`)
  return ['Environment variables are missing or invalid:', ...lines].join('\n')
}

export function assertAppEnvAtStartup(
  command: 'build' | 'serve',
  issues: readonly EnvIssue[],
  log: (message: string) => void = console.error,
): void {
  if (issues.length === 0) return
  const message = formatAppEnvIssues(issues)
  if (command === 'build') {
    throw new Error(message)
  }
  log(message)
}

export function compareNodeVersion(current: string, minimum: string): number {
  const parse = (value: string) =>
    value
      .replace(/^v/, '')
      .split(/[^0-9]+/)
      .filter(Boolean)
      .slice(0, 3)
      .map((part) => Number(part))
  const left = parse(current)
  const right = parse(minimum)
  for (let index = 0; index < 3; index += 1) {
    const delta = (left[index] ?? 0) - (right[index] ?? 0)
    if (delta !== 0) return delta
  }
  return 0
}

export function latestMigrationVersion(
  fileNames: readonly string[],
): string | null {
  const versions = fileNames
    .map((name) => /^(\d{14})_.+\.sql$/.exec(name)?.[1])
    .filter((version): version is string => Boolean(version))
    .sort()
  return versions.at(-1) ?? null
}
