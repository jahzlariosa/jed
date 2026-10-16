export type StarterDocFrontmatter = {
  title: string
  description: string
  slug: string
  order: number
}

export function parseFrontmatter(raw: string): {
  frontmatter: StarterDocFrontmatter
  body: string
} {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/)
  if (!match) {
    throw new Error('Missing frontmatter')
  }
  const yaml = match[1]
  const body = match[2].trimStart()
  const fields: Record<string, string> = {}
  for (const line of yaml.split('\n')) {
    const idx = line.indexOf(':')
    if (idx === -1) {
      continue
    }
    const key = line.slice(0, idx).trim()
    const value = line.slice(idx + 1).trim()
    fields[key] = value
  }
  const order = Number.parseInt(fields.order ?? '0', 10)
  return {
    frontmatter: {
      title: fields.title ?? '',
      description: fields.description ?? '',
      slug: fields.slug ?? '',
      order: Number.isFinite(order) ? order : 0,
    },
    body,
  }
}
