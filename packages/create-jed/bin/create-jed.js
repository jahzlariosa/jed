#!/usr/bin/env node
import { runCli } from '../lib/cli.js'

runCli(process.argv).catch((error) => {
  const message =
    error instanceof Error ? error.message : 'create-jed failed unexpectedly.'
  console.error(`Error: ${message}`)
  process.exit(1)
})
