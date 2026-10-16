import '@tanstack/react-start/server-only'

import { assertDomainAdmin } from '#/domain/helpers/admin-domain.server'
import { MIGRATION_EXPLANATIONS } from '#/lib/cms/migration-explanations'
import {
  collectAppliedMigrationKeys,
  migrationTemplateAppliedState,
} from '#/lib/cms/migration-applied'
import { listBundledSqlTemplates } from '#/lib/cms/sql-template-sources'
import type { DomainContext } from '#/domain/types'

export async function listSqlTemplatesDomain(ctx: DomainContext) {
  assertDomainAdmin(ctx)
  const supabase = ctx.supabase
  const { data: appliedRows, error } = await supabase.rpc(
    'list_applied_schema_migrations',
  )
  if (error) {
    console.error(error)
  }
  const applied = collectAppliedMigrationKeys(
    (appliedRows ?? []) as Array<{ version: string; name?: string | null }>,
  )

  const templates = listBundledSqlTemplates().map((item) => {
    const versionMatch = item.filename.match(/^(\d+)/)
    const version = versionMatch?.[1] ?? item.filename.replace(/\.sql$/, '')
    const meta = MIGRATION_EXPLANATIONS[item.filename]
    const appliedState = migrationTemplateAppliedState(
      item.filename,
      item.group,
      applied,
    )
    return {
      id: item.id,
      filename: item.filename,
      group: item.group,
      version,
      summary: meta?.summary ?? 'No explanation on file yet.',
      whenToRun: meta?.whenToRun ?? 'Ask your database operator.',
      applied: appliedState,
    }
  })

  return { templates }
}

export async function getSqlTemplateDomain(
  ctx: DomainContext,
  input: { id: string },
) {
  const templates = await listSqlTemplatesDomain(ctx)
  const match = templates.templates.find((t) => t.id === input.id)
  if (!match) {
    throw new Error('Template not found')
  }
  const bundled = listBundledSqlTemplates().find((t) => t.id === input.id)
  if (!bundled) {
    throw new Error('Template not found')
  }
  return { ...match, sql: bundled.sql }
}
