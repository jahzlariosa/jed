import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { runSetupNotice } from '../src/lib/env/setup-notice.ts'

async function main() {
  const file = resolve(process.cwd(), '.env.local')
  await runSetupNotice({
    env: process.env,
    tty: Boolean(process.stdin.isTTY && process.stdout.isTTY),
    readText: async () => (existsSync(file) ? readFileSync(file, 'utf8') : ''),
    log: (message) => {
      console.log(message)
    },
  })
}

if (process.argv[1]?.endsWith('postinstall-env-notice.mjs')) {
  main()
}
