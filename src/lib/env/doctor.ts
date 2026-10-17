import {
  collectAppEnvIssues,
  compareNodeVersion,
  formatAppEnvIssues,
  latestMigrationVersion,
  publishableKeyFromEnv,
  type EnvSource,
} from './schema.ts'
import {
  probeSupabase,
  readAppliedMigrations,
  type MigrationRead,
  type SupabaseProbe,
} from './supabase-probe.ts'

export type DoctorReport = {
  ok: boolean
  lines: string[]
}

export async function evaluateDoctor(input: {
  nodeVersion: string
  minimumNode: string
  env: EnvSource
  migrationFiles: readonly string[]
  probe?: typeof probeSupabase
  readMigrations?: typeof readAppliedMigrations
}): Promise<DoctorReport> {
  const lines: string[] = []
  let ok = true
  const nodeOk = compareNodeVersion(input.nodeVersion, input.minimumNode) >= 0
  lines.push(
    nodeOk
      ? `Node.js ${input.nodeVersion} meets ${input.minimumNode}`
      : `Node.js ${input.nodeVersion} is older than ${input.minimumNode}`,
  )
  if (!nodeOk) ok = false

  const issues = collectAppEnvIssues(input.env)
  if (issues.length > 0) {
    ok = false
    lines.push(formatAppEnvIssues(issues))
    lines.push('Supabase was not checked because the environment is incomplete')
    return { ok, lines }
  }
  lines.push('Environment variables are set')

  const url = input.env.VITE_SUPABASE_URL?.trim() ?? ''
  const publishable = publishableKeyFromEnv(input.env) ?? ''
  const probe = input.probe ?? probeSupabase
  const probed: SupabaseProbe = await probe(url, publishable)
  if (!probed.reachable) {
    ok = false
    lines.push('Supabase could not be reached')
    return { ok, lines }
  }
  if (!probed.keyAccepted) {
    ok = false
    lines.push('Supabase rejected the publishable key')
    return { ok, lines }
  }
  lines.push('Supabase accepted the publishable key')

  const latest = latestMigrationVersion(input.migrationFiles)
  if (!latest) {
    ok = false
    lines.push('No local migration files were found')
    return { ok, lines }
  }
  const readMigrations = input.readMigrations ?? readAppliedMigrations
  const serviceKey = input.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ?? ''
  const applied: MigrationRead = await readMigrations(url, [
    serviceKey,
    publishable,
  ])
  if (applied.status === 'skipped') {
    lines.push(
      'Applied migrations were not read because this key cannot view them',
    )
    return { ok, lines }
  }
  if (applied.status === 'unreachable') {
    ok = false
    lines.push('Applied migrations could not be read')
    return { ok, lines }
  }
  if (!applied.versions.includes(latest)) {
    ok = false
    lines.push(`Latest migration ${latest} is not applied`)
    return { ok, lines }
  }
  lines.push(`Latest migration ${latest} is applied`)
  return { ok, lines }
}
