import fs from 'node:fs/promises'
import path from 'node:path'

import { lockfilesToRemove } from './paths.js'
import { slugify } from './slugify.js'

/**
 * @param {string} sql
 * @returns {string}
 */
export function escapeSqlString(sql) {
  return sql.replace(/'/g, "''")
}

/**
 * Apply JED-specific post-processing to a scaffolded project.
 * @param {string} projectRoot absolute path
 * @param {{ packageName: string, siteName: string, pm: string }} options
 */
export async function postProcessProject(projectRoot, options) {
  const pkgPath = path.join(projectRoot, 'package.json')
  const pkgRaw = await fs.readFile(pkgPath, 'utf8')
  const pkg = JSON.parse(pkgRaw)
  pkg.name = options.packageName
  pkg.version = '0.1.0'
  pkg.private = true
  await fs.writeFile(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`, 'utf8')

  const envExample = path.join(projectRoot, '.env.example')
  const envLocal = path.join(projectRoot, '.env.local')
  await fs.copyFile(envExample, envLocal)

  await applySiteName(projectRoot, options.siteName)

  for (const lockfile of lockfilesToRemove(options.pm)) {
    await removeIfExists(path.join(projectRoot, lockfile))
  }
}

/**
 * @param {string} projectRoot
 * @param {string} siteName
 */
export async function applySiteName(projectRoot, siteName) {
  const brandDefaultsPath = path.join(
    projectRoot,
    'src/lib/cms/brand-defaults.ts',
  )
  let brandDefaults = await fs.readFile(brandDefaultsPath, 'utf8')
  brandDefaults = brandDefaults.replace(
    /export const DEFAULT_PUBLIC_SITE_NAME = '[^']*'/,
    `export const DEFAULT_PUBLIC_SITE_NAME = ${JSON.stringify(siteName)}`,
  )
  await fs.writeFile(brandDefaultsPath, brandDefaults, 'utf8')

  const publicSettingsPath = path.join(
    projectRoot,
    'src/lib/seo/public-settings.server.ts',
  )
  let publicSettings = await fs.readFile(publicSettingsPath, 'utf8')
  publicSettings = publicSettings.replace(
    /siteName: '[^']*'/,
    `siteName: ${JSON.stringify(siteName)}`,
  )
  await fs.writeFile(publicSettingsPath, publicSettings, 'utf8')

  const sqlEscaped = escapeSqlString(siteName)
  const migrationPaths = [
    'supabase/migrations/20261015130000_site_settings_neutral_defaults.sql',
    'supabase/migrations/20261016180000_jed_site_name.sql',
  ]
  for (const rel of migrationPaths) {
    const full = path.join(projectRoot, rel)
    try {
      let sql = await fs.readFile(full, 'utf8')
      sql = sql.replace(/'Jed'/g, `'${sqlEscaped}'`)
      await fs.writeFile(full, sql, 'utf8')
    } catch (error) {
      if (
        error &&
        typeof error === 'object' &&
        'code' in error &&
        error.code === 'ENOENT'
      ) {
        continue
      }
      throw error
    }
  }
}

/**
 * @param {string} targetDir
 * @param {string | undefined} explicitName
 * @returns {{ packageName: string, siteName: string }}
 */
export function resolveNames(targetDir, explicitName) {
  const folderBase = path.basename(path.resolve(targetDir))
  const packageName = slugify(folderBase)
  const siteName = explicitName?.trim() || folderBase
  return { packageName, siteName }
}

/**
 * @param {string} filePath
 */
async function removeIfExists(filePath) {
  try {
    await fs.unlink(filePath)
  } catch (error) {
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      error.code === 'ENOENT'
    ) {
      return
    }
    throw error
  }
}
