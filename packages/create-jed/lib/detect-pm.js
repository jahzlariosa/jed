/**
 * @param {string | undefined} userAgent npm_config_user_agent or similar
 * @returns {'npm' | 'pnpm' | 'yarn' | 'bun'}
 */
export function detectPackageManager(
  userAgent = process.env.npm_config_user_agent,
) {
  const ua = userAgent ?? ''
  if (ua.includes('pnpm')) {
    return 'pnpm'
  }
  if (ua.includes('yarn')) {
    return 'yarn'
  }
  if (ua.includes('bun')) {
    return 'bun'
  }
  return 'npm'
}

/**
 * @param {string | undefined} value
 * @returns {'npm' | 'pnpm' | 'yarn' | 'bun' | null}
 */
export function normalizePackageManager(value) {
  if (!value) {
    return null
  }
  const lower = value.trim().toLowerCase()
  if (
    lower === 'npm' ||
    lower === 'pnpm' ||
    lower === 'yarn' ||
    lower === 'bun'
  ) {
    return lower
  }
  return null
}
