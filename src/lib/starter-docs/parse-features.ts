export type FeatureLink = { label: string; href: string }

export type FeatureSection =
  | {
      kind: 'hero'
      eyebrow?: string
      headline?: string
      subhead?: string
      primaryCta?: FeatureLink
      secondaryCta?: FeatureLink
    }
  | {
      kind: 'section'
      title: string
      paragraphs: string[]
      links: FeatureLink[]
      codeBlocks: { lang: string; code: string }[]
    }
  | {
      kind: 'cta'
      headline?: string
      body?: string
      button?: FeatureLink
    }

function parseLinkLine(line: string): FeatureLink | null {
  const single = line.match(/^\*\*Link:\*\*\s*(.+?)\s*\(`([^`]+)`\)\s*$/)
  if (single) {
    return { label: single[1].trim(), href: single[2].trim() }
  }
  return null
}

function parseLinksLine(line: string): FeatureLink[] {
  const match = line.match(/^\*\*Links:\*\*\s*(.+)$/)
  if (!match) {
    return []
  }
  const rest = match[1]
  const links: FeatureLink[] = []
  const re = /([^,(]+?)\s*\(`([^`]+)`\)/g
  for (const m of rest.matchAll(re)) {
    links.push({ label: m[1].trim(), href: m[2].trim() })
  }
  return links
}

function parseCtaField(line: string, field: string): FeatureLink | null {
  const re = new RegExp(
    `^\\*\\*${field}:\\*\\*\\s*(.+?)\\s*\\(links to \`([^\`]+)\`\\)\\s*$`,
  )
  const m = line.match(re)
  if (!m) {
    return null
  }
  return { label: m[1].trim(), href: m[2].trim() }
}

export function parseFeaturesMarkdown(body: string): FeatureSection[] {
  const sections: FeatureSection[] = []
  const lines = body.split('\n')
  let i = 0

  while (i < lines.length) {
    const line = lines[i]
    if (line.startsWith('## ')) {
      const heading = line.slice(3).trim()
      if (heading === 'Hero') {
        const h: Extract<FeatureSection, { kind: 'hero' }> = { kind: 'hero' }
        i += 1
        while (i < lines.length && !lines[i].startsWith('## ')) {
          const row = lines[i]
          if (row.startsWith('**Eyebrow:**')) {
            h.eyebrow = row.replace('**Eyebrow:**', '').trim()
          } else if (row.startsWith('**Headline:**')) {
            h.headline = row.replace('**Headline:**', '').trim()
          } else if (row.startsWith('**Subhead:**')) {
            h.subhead = row.replace('**Subhead:**', '').trim()
          } else if (row.startsWith('**Primary CTA:**')) {
            h.primaryCta = parseCtaField(row, 'Primary CTA') ?? undefined
          } else if (row.startsWith('**Secondary CTA:**')) {
            h.secondaryCta = parseCtaField(row, 'Secondary CTA') ?? undefined
          }
          i += 1
        }
        sections.push(h)
        continue
      }
      if (heading === 'Closing CTA') {
        const cta: FeatureSection = { kind: 'cta' }
        const c = cta as Extract<FeatureSection, { kind: 'cta' }>
        i += 1
        while (i < lines.length && !lines[i].startsWith('## ')) {
          const row = lines[i]
          if (row.startsWith('**Headline:**')) {
            c.headline = row.replace('**Headline:**', '').trim()
          } else if (row.startsWith('**Body:**')) {
            c.body = row.replace('**Body:**', '').trim()
          } else if (row.startsWith('**Button:**')) {
            c.button = parseCtaField(row, 'Button') ?? undefined
          }
          i += 1
        }
        sections.push(c)
        continue
      }
      if (heading.startsWith('Section: ')) {
        const title = heading.slice('Section: '.length)
        const section: FeatureSection = {
          kind: 'section',
          title,
          paragraphs: [],
          links: [],
          codeBlocks: [],
        }
        i += 1
        while (i < lines.length && !lines[i].startsWith('## ')) {
          const row = lines[i]
          if (row.startsWith('```')) {
            const lang = row.slice(3).trim() || 'code'
            i += 1
            const codeLines: string[] = []
            while (i < lines.length && !lines[i].startsWith('```')) {
              codeLines.push(lines[i])
              i += 1
            }
            section.codeBlocks.push({ lang, code: codeLines.join('\n') })
            i += 1
            continue
          }
          const link = parseLinkLine(row)
          if (link) {
            section.links.push(link)
          } else {
            const links = parseLinksLine(row)
            if (links.length > 0) {
              section.links.push(...links)
            } else if (row.trim().length > 0) {
              section.paragraphs.push(row.trim())
            }
          }
          i += 1
        }
        sections.push(section)
        continue
      }
    }
    i += 1
  }

  return sections
}
