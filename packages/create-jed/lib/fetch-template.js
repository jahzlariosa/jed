import { Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import { extract } from 'tar'

import { isTemplateExcluded } from './paths.js'

const GITHUB_TARBALL = 'https://codeload.github.com/jahzlariosa/jed/tar.gz'

/**
 * Download and extract the JED template into targetDir.
 * @param {string} targetDir absolute empty or forced directory
 * @param {string} ref branch or tag
 */
export async function fetchAndExtractTemplate(targetDir, ref) {
  const url = `${GITHUB_TARBALL}/${encodeURIComponent(ref)}`
  const response = await fetch(url, {
    headers: { 'User-Agent': 'create-jed' },
    redirect: 'follow',
  })

  if (!response.ok) {
    throw new Error(
      `Could not download JED template (HTTP ${response.status}). Check --ref "${ref}" exists on GitHub.`,
    )
  }

  if (!response.body) {
    throw new Error('Empty response while downloading the JED template.')
  }

  const nodeStream = Readable.fromWeb(response.body)

  await pipeline(
    nodeStream,
    extract({
      cwd: targetDir,
      strip: 1,
      filter: (entryPath) => {
        const normalized = entryPath.replace(/\\/g, '/')
        const parts = normalized.split('/')
        if (parts.length < 2) {
          return true
        }
        const relative = parts.slice(1).join('/')
        return !isTemplateExcluded(relative)
      },
    }),
  )
}
