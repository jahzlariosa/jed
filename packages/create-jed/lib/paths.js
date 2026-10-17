/**
 * Paths excluded from the downloaded JED template (repo-only or agent tooling).
 * @param {string} relativePath path inside the repo root (no leading slash)
 * @returns {boolean}
 */
export function isTemplateExcluded(relativePath) {
  const normalized = relativePath.replace(/\\/g, '/').replace(/^\.\//, '')
  if (!normalized) {
    return false
  }

  if (normalized === 'packages' || normalized.startsWith('packages/')) {
    return true
  }

  if (normalized === '.cursor' || normalized.startsWith('.cursor/')) {
    return true
  }

  if (normalized === '.github/workflows/publish-create-jed.yml') {
    return true
  }

  return false
}

/** @type {Record<string, string[]>} */
export const LOCKFILES_BY_PM = {
  npm: ['package-lock.json'],
  pnpm: ['pnpm-lock.yaml'],
  yarn: ['yarn.lock'],
  bun: ['bun.lockb'],
}

const ALL_LOCKFILES = [
  'package-lock.json',
  'pnpm-lock.yaml',
  'yarn.lock',
  'bun.lockb',
]

/**
 * Lockfiles to delete when the user picks a package manager.
 * @param {string} pm
 * @returns {string[]}
 */
export function lockfilesToRemove(pm) {
  const keep = LOCKFILES_BY_PM[pm] ?? LOCKFILES_BY_PM.npm
  return ALL_LOCKFILES.filter((file) => !keep.includes(file))
}
