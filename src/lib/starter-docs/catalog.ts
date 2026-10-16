import { parseFrontmatter } from '#/lib/starter-docs/frontmatter'
import { starterDocNavLabel } from '#/lib/starter-docs/nav-label'
import { slugFromDocFile, docPathFromFileSlug } from '#/lib/starter-docs/paths'

const docModules = import.meta.glob('../../../content/starter-docs/docs/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

const featureModules = import.meta.glob(
  '../../../content/starter-docs/features/*.md',
  {
    query: '?raw',
    import: 'default',
    eager: true,
  },
) as Record<string, string>

export type StarterDocEntry = {
  fileSlug: string
  path: string
  title: string
  description: string
  order: number
  body: string
}

export const DOC_NAV_GROUPS: { label: string; fileSlugs: string[] }[] = [
  {
    label: 'Getting started',
    fileSlugs: ['index', 'getting-started', 'environment', 'deploy'],
  },
  { label: 'Auth', fileSlugs: ['auth-and-mfa', 'roles'] },
  {
    label: 'Content',
    fileSlugs: ['blog', 'search', 'contact', 'sql-templates'],
  },
  { label: 'API', fileSlugs: ['api', 'tokens-and-safety'] },
  { label: 'MCP', fileSlugs: ['mcp', 'caching'] },
  { label: 'Admin', fileSlugs: ['admin-panel'] },
]

function loadDocEntries(): StarterDocEntry[] {
  const entries: StarterDocEntry[] = []
  for (const [filePath, raw] of Object.entries(docModules)) {
    const fileSlug = slugFromDocFile(filePath)
    const { frontmatter, body } = parseFrontmatter(raw)
    entries.push({
      fileSlug,
      path: docPathFromFileSlug(fileSlug),
      title: frontmatter.title,
      description: frontmatter.description,
      order: frontmatter.order,
      body,
    })
  }
  return entries.sort((a, b) => a.order - b.order)
}

const docEntries = loadDocEntries()

export function listStarterDocs(): StarterDocEntry[] {
  return docEntries
}

export function getStarterDocByFileSlug(
  fileSlug: string,
): StarterDocEntry | undefined {
  return docEntries.find((entry) => entry.fileSlug === fileSlug)
}

export function getStarterDocByRouteSlug(
  routeSlug: string | undefined,
): StarterDocEntry | undefined {
  const fileSlug = routeSlug && routeSlug.length > 0 ? routeSlug : 'index'
  return getStarterDocByFileSlug(fileSlug)
}

export type DocsSearchHit = {
  path: string
  title: string
  snippet: string
}

export function searchStarterDocs(query: string): DocsSearchHit[] {
  const q = query.trim().toLowerCase()
  if (!q) {
    return []
  }
  return docEntries
    .map((entry) => {
      const haystack =
        `${entry.title} ${entry.description} ${entry.body}`.toLowerCase()
      const idx = haystack.indexOf(q)
      if (idx === -1) {
        return null
      }
      const start = Math.max(0, idx - 40)
      const end = Math.min(haystack.length, idx + q.length + 60)
      const snippet = entry.body.replace(/\s+/g, ' ').slice(start, end).trim()
      return {
        path: entry.path,
        title: starterDocNavLabel(entry),
        snippet: snippet.length > 0 ? snippet : entry.description,
      }
    })
    .filter((hit): hit is DocsSearchHit => hit !== null)
    .slice(0, 12)
}

export function getStarterFeatureRaw(fileSlug: string): string | undefined {
  const key = Object.keys(featureModules).find((path) =>
    path.endsWith(`/${fileSlug}.md`),
  )
  if (!key) {
    return undefined
  }
  return featureModules[key]
}
