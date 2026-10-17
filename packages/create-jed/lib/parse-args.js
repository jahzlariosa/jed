import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'

const __dirname = dirname(fileURLToPath(import.meta.url))
const pkg = JSON.parse(
  readFileSync(join(__dirname, '..', 'package.json'), 'utf8'),
)
const VERSION = pkg.version

/**
 * @typedef {object} CliOptions
 * @property {string | undefined} targetDir
 * @property {string | undefined} name
 * @property {string | undefined} pm
 * @property {boolean} install
 * @property {boolean} git
 * @property {boolean} yes
 * @property {string} ref
 * @property {boolean} force
 * @property {boolean} help
 * @property {boolean} version
 */

/**
 * @param {string[]} argv process.argv
 * @returns {CliOptions}
 */
export function parseCliArgs(argv) {
  const { values, positionals } = parseArgs({
    args: argv.slice(2),
    options: {
      name: { type: 'string' },
      pm: { type: 'string' },
      'no-install': { type: 'boolean', default: false },
      'no-git': { type: 'boolean', default: false },
      yes: { type: 'boolean', default: false },
      ref: { type: 'string', default: 'main' },
      force: { type: 'boolean', default: false },
      help: { type: 'boolean', default: false },
      version: { type: 'boolean', default: false },
    },
    allowPositionals: true,
  })

  const install = values['no-install'] !== true
  const git = values['no-git'] !== true

  return {
    targetDir: positionals[0],
    name: values.name,
    pm: values.pm,
    install,
    git,
    yes: values.yes === true,
    ref: values.ref ?? 'main',
    force: values.force === true,
    help: values.help === true,
    version: values.version === true,
  }
}

export function printHelp() {
  console.log(`create-jed — scaffold a new JED site

Usage:
  npm create jed@latest [directory] [options]
  npx create-jed [directory] [options]

Options:
  --name <site name>     Public site name (default: folder name)
  --pm <npm|pnpm|yarn|bun>  Package manager (default: detect from user agent)
  --no-install           Skip dependency install
  --no-git               Skip git init
  --yes                  Use defaults (non-interactive)
  --ref <branch|tag>     GitHub ref for the template (default: main)
  --force                Overwrite a non-empty directory
  --help                 Show this help
  --version              Show version
`)
}

export function getVersion() {
  return VERSION
}
