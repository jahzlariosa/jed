/** Bundled SQL files for the admin SQL templates screen (read-only). */
export const SQL_MIGRATION_MODULES = import.meta.glob(
  '../../../supabase/migrations/*.sql',
  { query: '?raw', import: 'default', eager: true },
) as Record<string, string>

export const SQL_SEED_MODULES = import.meta.glob('../../../supabase/seed.sql', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

export function listBundledSqlTemplates() {
  const items: Array<{
    id: string
    filename: string
    sql: string
    group: 'migration' | 'seed'
  }> = []
  for (const [path, sql] of Object.entries(SQL_MIGRATION_MODULES)) {
    const filename = path.split('/').pop() ?? path
    items.push({ id: filename, filename, sql, group: 'migration' })
  }
  for (const [path, sql] of Object.entries(SQL_SEED_MODULES)) {
    const filename = path.split('/').pop() ?? 'seed.sql'
    items.push({ id: `seed:${filename}`, filename, sql, group: 'seed' })
  }
  return items.sort((a, b) => a.filename.localeCompare(b.filename))
}
