import { collectAppEnvIssues } from './schema.ts'
import { parseEnvFile } from './env-file.ts'

export function shouldShowSetupNotice(
  env: Record<string, string | undefined>,
  tty: boolean,
): boolean {
  if (!tty) return false
  if (env.CI === 'true' || env.CI === '1') return false
  if (env.VERCEL || env.VERCEL_ENV) return false
  return true
}

/**
 * Prints a setup hint when .env.local is missing or incomplete.
 * Always resolves. Callers must not fail the install on the result.
 */
export async function runSetupNotice(input: {
  env: Record<string, string | undefined>
  tty: boolean
  readText: () => Promise<string>
  log: (message: string) => void
}): Promise<'silent' | 'shown' | 'error'> {
  try {
    if (!shouldShowSetupNotice(input.env, input.tty)) return 'silent'
    const text = await input.readText()
    const issues = collectAppEnvIssues({
      ...parseEnvFile(text),
      NODE_ENV: 'development',
    })
    if (issues.length === 0) return 'silent'
    const names = issues.map((issue) => issue.name).join(', ')
    input.log(`JED setup is incomplete (${names}). Run npm run setup`)
    return 'shown'
  } catch {
    input.log('Setup notice could not run.')
    return 'error'
  }
}
