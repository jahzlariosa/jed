export type AppliedMigrationRow = { version: string; name?: string | null }

export function collectAppliedMigrationKeys(
  rows: AppliedMigrationRow[] | null | undefined,
): Set<string> {
  const applied = new Set<string>()
  for (const row of rows ?? []) {
    if (row.version) {
      applied.add(row.version)
    }
    if (row.name) {
      applied.add(row.name)
      const withoutExt = row.name.replace(/\.sql$/i, '')
      if (withoutExt !== row.name) {
        applied.add(withoutExt)
      }
    }
  }
  return applied
}

export function migrationTemplateAppliedState(
  filename: string,
  group: 'migration' | 'seed',
  applied: Set<string>,
): 'applied' | 'pending' | 'n/a' {
  if (group === 'seed') {
    return 'n/a'
  }
  const versionMatch = filename.match(/^(\d+)/)
  const version = versionMatch?.[1] ?? filename.replace(/\.sql$/, '')
  const stem = filename.replace(/\.sql$/, '')
  if (applied.has(version) || applied.has(stem) || applied.has(filename)) {
    return 'applied'
  }
  for (const key of applied) {
    if (key === stem || key.endsWith(stem) || stem.startsWith(`${key}_`)) {
      return 'applied'
    }
  }
  return 'pending'
}
