import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { parseCliArgs } from '../lib/parse-args.js'

describe('parseCliArgs', () => {
  it('parses positional directory and flags', () => {
    const result = parseCliArgs([
      'node',
      'create-jed',
      'acme',
      '--name',
      'Acme Co',
      '--pm',
      'pnpm',
      '--no-install',
      '--no-git',
      '--ref',
      'main',
      '--force',
      '--yes',
    ])
    assert.equal(result.targetDir, 'acme')
    assert.equal(result.name, 'Acme Co')
    assert.equal(result.pm, 'pnpm')
    assert.equal(result.install, false)
    assert.equal(result.git, false)
    assert.equal(result.ref, 'main')
    assert.equal(result.force, true)
    assert.equal(result.yes, true)
  })

  it('defaults install and git to true', () => {
    const result = parseCliArgs(['node', 'create-jed'])
    assert.equal(result.install, true)
    assert.equal(result.git, true)
    assert.equal(result.ref, 'main')
  })
})
