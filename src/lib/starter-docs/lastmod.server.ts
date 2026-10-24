import '@tanstack/react-start/server-only'

import fs from 'node:fs'
import path from 'node:path'

const DOCS_DIR = path.join(process.cwd(), 'content/starter-docs/docs')

export function starterDocLastModifiedIso(
  fileSlug: string,
): string | undefined {
  const filePath = path.join(DOCS_DIR, `${fileSlug}.md`)
  try {
    const stat = fs.statSync(filePath)
    return stat.mtime.toISOString()
  } catch {
    return undefined
  }
}
