import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { after, describe, it } from 'node:test'

import { assertSafeTargetDirectory, isDirectoryEmpty } from '../lib/fs-guard.js'

describe('overwrite guard', () => {
  let tmpRoot

  after(async () => {
    if (tmpRoot) {
      await fs.rm(tmpRoot, { recursive: true, force: true })
    }
  })

  it('allows missing or empty directories', async () => {
    tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'create-jed-guard-'))
    const empty = path.join(tmpRoot, 'empty')
    await fs.mkdir(empty)
    assert.equal(await isDirectoryEmpty(empty), true)
    await assertSafeTargetDirectory(empty, false)

    const missing = path.join(tmpRoot, 'missing')
    await assertSafeTargetDirectory(missing, false)
  })

  it('refuses non-empty directories without force', async () => {
    const dir = path.join(tmpRoot, 'filled')
    await fs.mkdir(dir, { recursive: true })
    await fs.writeFile(path.join(dir, 'keep.txt'), 'x', 'utf8')
    assert.equal(await isDirectoryEmpty(dir), false)
    await assert.rejects(
      () => assertSafeTargetDirectory(dir, false),
      /not empty/,
    )
    await assertSafeTargetDirectory(dir, true)
  })
})
