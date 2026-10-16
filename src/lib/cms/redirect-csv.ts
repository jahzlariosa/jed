import { safeInternalPath } from '#/auth/path'

export type ParsedRedirectRow = {
  fromPath: string
  toPath: string
  statusCode: 301 | 302 | 410
  enabled: boolean
  isExternal: boolean
}

export function escapeCsvField(value: string): string {
  let field = value
  if (/^[=+\-@\t\r]/.test(field)) {
    field = `'${field}`
  }
  return `"${field.replace(/"/g, '""')}"`
}

/** Parse CSV into rows of fields (quote-aware, including newlines in quoted fields). */
export function parseCsvTable(csv: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false
  let fieldStarted = false

  for (let index = 0; index < csv.length; index += 1) {
    const char = csv[index]
    if (inQuotes) {
      if (char === '"') {
        if (csv[index + 1] === '"') {
          field += '"'
          index += 1
        } else {
          inQuotes = false
        }
      } else {
        field += char
      }
      continue
    }
    if (char === '"') {
      if (!fieldStarted) {
        fieldStarted = true
      }
      inQuotes = true
      continue
    }
    if (char === ',') {
      row.push(field)
      field = ''
      fieldStarted = false
      continue
    }
    if (char === '\r') {
      if (csv[index + 1] === '\n') {
        index += 1
      }
      row.push(field)
      if (row.some((cell) => cell.length > 0) || field.length > 0) {
        rows.push(row)
      }
      row = []
      field = ''
      fieldStarted = false
      continue
    }
    if (char === '\n') {
      row.push(field)
      if (row.some((cell) => cell.length > 0) || field.length > 0) {
        rows.push(row)
      }
      row = []
      field = ''
      fieldStarted = false
      continue
    }
    fieldStarted = true
    field += char
  }
  row.push(field)
  if (row.some((cell) => cell.length > 0)) {
    rows.push(row)
  }
  return rows
}

export function parseCsvLine(line: string): string[] {
  const rows = parseCsvTable(line)
  return rows[0] ?? []
}

export function parseCsvRecords(csv: string): string[] {
  const rows = parseCsvTable(csv)
  return rows.map((cells) => cells.join(','))
}

export function normalizeImportedCsvField(value: string): string {
  const trimmed = value.trim()
  if (
    trimmed.startsWith("'") &&
    trimmed.length > 1 &&
    /^[=+\-@\t\r]/.test(trimmed.slice(1))
  ) {
    return trimmed.slice(1)
  }
  return trimmed
}

function parseExternalTarget(raw: string, allowHosts: string[]): string | null {
  try {
    const url = new URL(raw.trim())
    if (url.protocol !== 'https:') {
      return null
    }
    if (!allowHosts.includes(url.hostname)) {
      return null
    }
    return url.href
  } catch {
    return null
  }
}

export function parseRedirectCsvRows(
  csv: string,
  allowHosts: string[],
  maxRows = 1000,
): { rows: ParsedRedirectRow[] } | { error: string } {
  const table = parseCsvTable(csv)
  if (table.length < 2) {
    return { error: 'CSV must include a header row and at least one redirect.' }
  }
  const header = table[0].join(',').toLowerCase()
  if (!header.startsWith('from_path,')) {
    return {
      error:
        'CSV header must start with from_path,to_path,status_code,enabled,is_external.',
    }
  }
  const dataRows = table.slice(1)
  if (dataRows.length > maxRows) {
    return { error: `CSV may include at most ${maxRows} redirects.` }
  }
  const rows: ParsedRedirectRow[] = []
  for (const parts of dataRows) {
    if (parts.length < 4) {
      return {
        error:
          'Each CSV row must include from_path, to_path, status_code, and enabled.',
      }
    }
    const [fromRaw, toRaw, codeRaw, enabledRaw, externalRaw] = parts
    const status = Number(normalizeImportedCsvField(codeRaw))
    const statusCode = status === 410 ? 410 : status === 302 ? 302 : 301
    const fromPath = safeInternalPath(normalizeImportedCsvField(fromRaw), null)
    if (!fromPath) {
      return { error: `Invalid from path: ${fromRaw}` }
    }
    const isExternal = normalizeImportedCsvField(externalRaw ?? '') === 'true'
    let toPath: string | null
    const toValue = normalizeImportedCsvField(toRaw)
    if (statusCode === 410) {
      toPath = toValue || '/'
    } else if (isExternal) {
      toPath = parseExternalTarget(toValue, allowHosts)
      if (!toPath) {
        return { error: `External to URL is not allowed: ${toRaw}` }
      }
    } else {
      toPath = safeInternalPath(toValue, null)
      if (!toPath) {
        return { error: `Invalid to path: ${toRaw}` }
      }
    }
    if (fromPath === toPath) {
      return { error: 'This redirect would create a loop.' }
    }
    rows.push({
      fromPath,
      toPath,
      statusCode,
      enabled: normalizeImportedCsvField(enabledRaw) !== 'false',
      isExternal,
    })
  }
  return { rows }
}

export function detectRedirectCycle(
  edges: Array<{ from: string; to: string }>,
): boolean {
  const graph = new Map<string, string>()
  for (const { from, to } of edges) {
    graph.set(from, to)
  }
  for (const start of graph.keys()) {
    const seen = new Set<string>()
    let current: string | undefined = start
    for (let step = 0; step < graph.size + 2; step += 1) {
      if (!current) break
      if (seen.has(current)) {
        return true
      }
      seen.add(current)
      const next = graph.get(current)
      if (!next) break
      if (next.startsWith('http')) break
      current = next
    }
  }
  return false
}
