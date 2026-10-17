import fs from 'node:fs/promises'

/**
 * @param {string} dir
 * @returns {Promise<boolean>}
 */
export async function isDirectoryEmpty(dir) {
  try {
    const entries = await fs.readdir(dir)
    return entries.length === 0
  } catch (error) {
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      error.code === 'ENOENT'
    ) {
      return true
    }
    throw error
  }
}

/**
 * Refuse to use a non-empty directory unless force is set.
 * @param {string} targetDir absolute path
 * @param {boolean} force
 */
export async function assertSafeTargetDirectory(targetDir, force) {
  const exists = await pathExists(targetDir)
  if (!exists) {
    return
  }
  const empty = await isDirectoryEmpty(targetDir)
  if (!empty && !force) {
    throw new Error(
      `Directory "${targetDir}" is not empty. Choose another path or pass --force.`,
    )
  }
}

/**
 * @param {string} p
 */
async function pathExists(p) {
  try {
    await fs.access(p)
    return true
  } catch {
    return false
  }
}
