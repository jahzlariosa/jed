import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { after, before, describe, it } from 'node:test'

import {
  applySiteName,
  escapeSqlString,
  postProcessProject,
} from '../lib/post-process.js'

const fixtureRoot = path.join(import.meta.dirname, 'fixtures', 'minimal')

describe('postProcessProject', () => {
  let workDir

  before(async () => {
    workDir = await fs.mkdtemp(path.join(os.tmpdir(), 'create-jed-pp-'))
    await fs.cp(fixtureRoot, workDir, { recursive: true })
  })

  after(async () => {
    if (workDir) {
      await fs.rm(workDir, { recursive: true, force: true })
    }
  })

  it('escapes SQL strings', () => {
    assert.equal(escapeSqlString("O'Hare"), "O''Hare")
  })

  it('updates package.json, env, and site name files', async () => {
    await postProcessProject(workDir, {
      packageName: 'acme-site',
      siteName: 'Acme Studio',
      pm: 'pnpm',
    })

    const pkg = JSON.parse(
      await fs.readFile(path.join(workDir, 'package.json'), 'utf8'),
    )
    assert.equal(pkg.name, 'acme-site')
    assert.equal(pkg.version, '0.1.0')
    assert.equal(pkg.private, true)

    const envLocal = await fs.readFile(path.join(workDir, '.env.local'), 'utf8')
    assert.match(envLocal, /VITE_SUPABASE_URL/)

    const brand = await fs.readFile(
      path.join(workDir, 'src/lib/cms/brand-defaults.ts'),
      'utf8',
    )
    assert.match(brand, /DEFAULT_PUBLIC_SITE_NAME = "Acme Studio"/)

    const migration = await fs.readFile(
      path.join(
        workDir,
        'supabase/migrations/20261015130000_site_settings_neutral_defaults.sql',
      ),
      'utf8',
    )
    assert.match(migration, /site_name = 'Acme Studio'/)

    await assert.rejects(() =>
      fs.access(path.join(workDir, 'package-lock.json')),
    )
    await fs.access(path.join(workDir, 'pnpm-lock.yaml'))
  })
})

describe('applySiteName', () => {
  it('updates brand defaults only', async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'create-jed-name-'))
    await fs.mkdir(path.join(dir, 'src/lib/cms'), { recursive: true })
    await fs.mkdir(path.join(dir, 'src/lib/seo'), { recursive: true })
    await fs.writeFile(
      path.join(dir, 'src/lib/cms/brand-defaults.ts'),
      "export const DEFAULT_PUBLIC_SITE_NAME = 'JED'\n",
      'utf8',
    )
    await fs.writeFile(
      path.join(dir, 'src/lib/seo/public-settings.server.ts'),
      "const DEFAULTS = { siteName: 'JED' }\n",
      'utf8',
    )
    await applySiteName(dir, 'Demo')
    const brand = await fs.readFile(
      path.join(dir, 'src/lib/cms/brand-defaults.ts'),
      'utf8',
    )
    assert.match(brand, /"Demo"/)
    await fs.rm(dir, { recursive: true, force: true })
  })
})
