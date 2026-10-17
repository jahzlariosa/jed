import { spawn } from 'node:child_process'
import fs from 'node:fs/promises'
import path from 'node:path'

import { assertSafeTargetDirectory } from './fs-guard.js'
import { fetchAndExtractTemplate } from './fetch-template.js'
import { normalizePackageManager } from './detect-pm.js'
import { getVersion, parseCliArgs, printHelp } from './parse-args.js'
import { postProcessProject, resolveNames } from './post-process.js'
import { promptForOptions } from './prompts.js'

/**
 * @param {string[]} argv
 */
export async function runCli(argv) {
  const options = parseCliArgs(argv)

  if (options.help) {
    printHelp()
    return
  }

  if (options.version) {
    console.log(getVersion())
    return
  }

  const defaultDir = options.targetDir ?? 'my-site'
  const answers = await promptForOptions(options, defaultDir)

  const pm = normalizePackageManager(answers.pm)
  if (!pm) {
    throw new Error('Package manager must be npm, pnpm, yarn, or bun.')
  }

  const targetDir = path.resolve(process.cwd(), answers.targetDir)
  await assertSafeTargetDirectory(targetDir, options.force)
  await fs.mkdir(targetDir, { recursive: true })

  const { packageName, siteName } = resolveNames(targetDir, answers.siteName)

  console.log('')
  console.log(`Creating JED site in ${targetDir}`)
  console.log(`  Site name: ${siteName}`)
  console.log(`  Package name: ${packageName}`)
  console.log(`  Template ref: ${options.ref}`)
  console.log('')

  console.log('Downloading template from GitHub...')
  await fetchAndExtractTemplate(targetDir, options.ref)

  console.log('Configuring project...')
  await postProcessProject(targetDir, { packageName, siteName, pm })

  if (answers.install) {
    console.log(`Installing dependencies with ${pm}...`)
    await runPackageManager(pm, ['install'], targetDir)
  }

  if (answers.git) {
    console.log('Initializing git repository...')
    await runGit(['init'], targetDir)
    await runGit(['add', '-A'], targetDir)
    await runGit(
      ['commit', '-m', 'Initial commit from create-jed'],
      targetDir,
    ).catch(() => {
      console.log(
        '  Skipped initial commit (git user.name/email may be unset).',
      )
    })
  }

  printNextSteps(targetDir, pm, answers.install)
}

/**
 * @param {string} targetDir
 * @param {string} pm
 * @param {boolean} installed
 */
function printNextSteps(targetDir, pm, installed) {
  const rel = path.relative(process.cwd(), targetDir) || '.'
  const installCmd =
    pm === 'npm'
      ? 'npm ci'
      : pm === 'pnpm'
        ? 'pnpm install'
        : pm === 'yarn'
          ? 'yarn install'
          : 'bun install'

  console.log('')
  console.log('Done. Next steps:')
  console.log('')
  console.log(`  cd ${rel}`)
  if (!installed) {
    console.log(`  ${installCmd}`)
  }
  console.log('  Fill Supabase keys in .env.local (copied from .env.example)')
  console.log(
    '  Apply migrations: npx supabase db push (hosted) or npx supabase db reset (local)',
  )
  console.log('  Grant your first admin (see README.md), then run:')
  const devCmd =
    pm === 'npm'
      ? 'npm run dev'
      : pm === 'pnpm'
        ? 'pnpm dev'
        : pm === 'yarn'
          ? 'yarn dev'
          : 'bun run dev'
  console.log(`  ${devCmd}`)
  console.log('')
}

/**
 * @param {'npm' | 'pnpm' | 'yarn' | 'bun'} pm
 * @param {string[]} args
 * @param {string} cwd
 */
function runPackageManager(pm, args, cwd) {
  const command = pm === 'yarn' ? 'yarn' : pm
  const fullArgs = pm === 'yarn' && args[0] === 'install' ? [] : args
  return runCommand(command, fullArgs, cwd)
}

/**
 * @param {string[]} args
 * @param {string} cwd
 */
function runGit(args, cwd) {
  return runCommand('git', args, cwd)
}

/**
 * @param {string} command
 * @param {string[]} args
 * @param {string} cwd
 */
function runCommand(command, args, cwd) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      stdio: 'inherit',
      shell: process.platform === 'win32',
    })
    child.on('error', reject)
    child.on('close', (code) => {
      if (code === 0) {
        resolve()
      } else {
        reject(new Error(`Command failed: ${command} ${args.join(' ')}`))
      }
    })
  })
}
