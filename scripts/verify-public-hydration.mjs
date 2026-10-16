import { spawn } from 'node:child_process'
import { execSync } from 'node:child_process'
import { setTimeout as sleep } from 'node:timers/promises'
import { chromium } from 'playwright'

const PORT = 4173

try {
  execSync(`fuser -k ${PORT}/tcp`, { stdio: 'ignore' })
} catch {
  // port was free
}
const BASE = `http://127.0.0.1:${PORT}`

async function waitForServer() {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const response = await fetch(`${BASE}/`)
      if (response.ok) {
        const body = await response.text()
        if (!body.includes('id="main-content"')) {
          continue
        }
        const csp = response.headers.get('content-security-policy')
        if (csp?.includes("'strict-dynamic'")) {
          throw new Error(`Public HTML CSP must not use strict-dynamic: ${csp}`)
        }
        if (csp?.includes('nonce-')) {
          throw new Error(`Public HTML CSP must not use nonces: ${csp}`)
        }
        if (!csp?.includes("'sha256-")) {
          throw new Error(
            `Public HTML CSP must include inline script hashes: ${csp}`,
          )
        }
        return
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('strict-dynamic')) {
        throw error
      }
    }
    await sleep(500)
  }
  throw new Error('Preview server did not start')
}

const preview = spawn(
  'npm',
  ['run', 'preview', '--', '--host', '127.0.0.1', '--port', String(PORT)],
  {
    cwd: process.cwd(),
    stdio: 'pipe',
    env: { ...process.env, NODE_ENV: 'production' },
  },
)

let failed = false
try {
  await waitForServer()
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()
  await page.setViewportSize({ width: 1280, height: 720 })
  const cspViolations = []
  page.on('console', (message) => {
    const text = message.text()
    const lower = text.toLowerCase()
    if (
      lower.includes('content security policy') ||
      lower.includes('refused to execute') ||
      lower.includes('refused to load')
    ) {
      cspViolations.push(text)
    }
  })
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' })
  const main = page.locator('#main-content')
  await main.waitFor({ state: 'attached', timeout: 60_000 })
  const featuresLink = page
    .getByLabel('Primary')
    .getByRole('link', { name: 'Features' })
  await featuresLink.waitFor({ state: 'visible', timeout: 30_000 })
  const homeTitle = await page.title()
  await featuresLink.click({ noWaitAfter: true })
  await page.waitForURL('**/features**', { timeout: 30_000 })
  await page
    .locator('h1')
    .first()
    .waitFor({ state: 'visible', timeout: 30_000 })
  const featuresTitle = await page.title()
  const searchInput = page.locator('#home-nav-search, input[name="q"]').first()
  await searchInput.fill('seo')
  await searchInput.press('Enter')
  await page.waitForURL('**/search**', { timeout: 15_000 })
  const searchTitle = await page.title()
  if (!homeTitle || !featuresTitle || !searchTitle) {
    throw new Error('Missing document title after navigation')
  }
  if (cspViolations.length > 0) {
    throw new Error(`CSP violations: ${cspViolations.join('; ')}`)
  }
  await browser.close()
  console.log(
    `Hydration check passed: "${homeTitle}" -> "${featuresTitle}" -> "${searchTitle}", no CSP console errors.`,
  )
} catch (error) {
  failed = true
  console.error(error)
  process.exitCode = 1
} finally {
  preview.kill('SIGTERM')
}

if (!failed) {
  process.exit(0)
}
