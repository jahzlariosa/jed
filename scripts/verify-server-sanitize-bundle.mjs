#!/usr/bin/env node
/**
 * Post-build smoke check: server function output must not bundle jsdom / BlockNote server.
 */
import { globSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = join(process.cwd(), '.vercel/output/functions/__server.func')
const patterns = ['**/*.mjs', '**/*.js', '**/*.cjs']

const forbiddenSubstrings = [
  'isomorphic-dompurify',
  '@blocknote/server-util',
  'ServerBlockNoteEditor',
]

function bundlesJsdomPackage(text) {
  return (
    /from\s+["']jsdom["']/.test(text) ||
    /require\(\s*["']jsdom["']\)/.test(text) ||
    text.includes('node_modules/jsdom/')
  )
}

const files = []
try {
  for (const pattern of patterns) {
    files.push(...globSync(join(root, pattern), { withFileTypes: false }))
  }
} catch {
  console.error(
    'verify-server-sanitize-bundle: .vercel/output/functions/__server.func not found — run npm run build first',
  )
  process.exit(1)
}

if (files.length === 0) {
  console.error(
    'verify-server-sanitize-bundle: no bundle files under server function output',
  )
  process.exit(1)
}

const hits = []
for (const file of files) {
  let text
  try {
    text = readFileSync(file, 'utf8')
  } catch {
    continue
  }
  for (const needle of forbiddenSubstrings) {
    if (text.includes(needle)) {
      hits.push({ file, needle })
    }
  }
  if (bundlesJsdomPackage(text)) {
    hits.push({ file, needle: 'jsdom (package import)' })
  }
}

if (hits.length > 0) {
  console.error('Forbidden server bundle dependencies found:')
  for (const { file, needle } of hits) {
    console.error(`  ${needle} in ${file}`)
  }
  process.exit(1)
}

console.log(
  `verify-server-sanitize-bundle: ok (${files.length} server files scanned, no jsdom/BlockNote server)`,
)
