/** Parse and update .env files without printing values. */

export function parseEnvFile(text: string): Record<string, string> {
  const env: Record<string, string> = {}
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const match = /^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/.exec(
      trimmed,
    )
    if (!match?.[1] || match[2] === undefined) continue
    env[match[1]] = unquote(match[2])
  }
  return env
}

function unquote(raw: string): string {
  const trimmed = raw.trim()
  if (trimmed.length >= 2 && trimmed.startsWith('"') && trimmed.endsWith('"')) {
    return trimmed
      .slice(1, -1)
      .replace(/\\n/g, '\n')
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, '\\')
  }
  if (trimmed.length >= 2 && trimmed.startsWith("'") && trimmed.endsWith("'")) {
    return trimmed.slice(1, -1)
  }
  const comment = trimmed.indexOf(' #')
  if (comment !== -1) return trimmed.slice(0, comment).trim()
  return trimmed
}

export function formatEnvValue(value: string): string {
  if (value.includes('\n') || value.includes('\r')) {
    throw new Error('Environment values cannot contain line breaks')
  }
  if (/[\s#"'\\]/.test(value) || value === '') {
    return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`
  }
  return value
}

/** Replace named keys in place and append any that are missing. */
export function upsertEnvValues(
  text: string,
  values: Record<string, string>,
): string {
  const pending = new Map(Object.entries(values))
  const normalized = text.replace(/\r\n/g, '\n')
  const lines = normalized.split('\n')
  if (lines.at(-1) === '') lines.pop()
  const out = lines.map((line) => {
    const match = /^(\s*(?:export\s+)?)([A-Za-z_][A-Za-z0-9_]*)\s*=/.exec(line)
    const key = match?.[2]
    if (!key || !pending.has(key)) return line
    const value = pending.get(key)
    pending.delete(key)
    if (value === undefined) return line
    return `${key}=${formatEnvValue(value)}`
  })
  for (const [key, value] of pending) {
    out.push(`${key}=${formatEnvValue(value)}`)
  }
  return `${out.join('\n')}\n`
}
