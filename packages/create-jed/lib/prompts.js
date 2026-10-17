import readline from 'node:readline/promises'
import { stdin as input, stdout as output } from 'node:process'

import { detectPackageManager, normalizePackageManager } from './detect-pm.js'

/**
 * @param {import('./parse-args.js').CliOptions} options
 * @param {string} defaultDir
 * @returns {Promise<{
 *   targetDir: string
 *   siteName: string
 *   pm: 'npm' | 'pnpm' | 'yarn' | 'bun'
 *   install: boolean
 *   git: boolean
 * }>}
 */
export async function promptForOptions(options, defaultDir) {
  if (options.yes) {
    const pm = normalizePackageManager(options.pm) ?? detectPackageManager()
    const targetDir = options.targetDir ?? defaultDir
    const siteName = options.name?.trim() || targetDir
    return {
      targetDir,
      siteName,
      pm,
      install: options.install,
      git: options.git,
    }
  }

  const rl = readline.createInterface({ input, output })

  try {
    let targetDir = options.targetDir?.trim()
    if (!targetDir) {
      const targetAnswer = await rl.question(`Project folder (${defaultDir}): `)
      targetDir = targetAnswer.trim() || defaultDir
    }

    const nameDefault = options.name?.trim() || targetDir
    const nameAnswer = await rl.question(`Site name (${nameDefault}): `)
    const siteName = nameAnswer.trim() || nameDefault

    const detected = detectPackageManager()
    const pmDefault = normalizePackageManager(options.pm) ?? detected
    const pmAnswer = await rl.question(
      `Package manager (${pmDefault}) [npm/pnpm/yarn/bun]: `,
    )
    const pm =
      normalizePackageManager(pmAnswer) ??
      normalizePackageManager(options.pm) ??
      detected

    let install = options.install
    if (!options.yes && options.install) {
      const installAnswer = await rl.question(
        'Install dependencies now? (Y/n): ',
      )
      if (installAnswer.trim().toLowerCase() === 'n') {
        install = false
      }
    }

    let git = options.git
    if (!options.yes && options.git) {
      const gitAnswer = await rl.question(
        'Initialize a git repository? (Y/n): ',
      )
      if (gitAnswer.trim().toLowerCase() === 'n') {
        git = false
      }
    }

    return { targetDir, siteName, pm, install, git }
  } finally {
    rl.close()
  }
}
