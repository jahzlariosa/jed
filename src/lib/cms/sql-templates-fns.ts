import { createServerFn } from '@tanstack/react-start'

import { requireAdminRead } from '#/auth/admin-access.server'
import { markPrivateNoStore } from '#/auth/session.server'
import { MIGRATION_EXPLANATIONS } from '#/lib/cms/migration-explanations'
import {
  collectAppliedMigrationKeys,
  migrationTemplateAppliedState,
} from '#/lib/cms/migration-applied'
import { listBundledSqlTemplates } from '#/lib/cms/sql-template-sources'

export const listSqlTemplatesFn = createServerFn({ method: 'GET' }).handler(
  async () => {
    markPrivateNoStore()
    const { supabase } = await requireAdminRead()
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
        ...item,
        version,
        summary: meta?.summary ?? 'No explanation on file yet.',
        whenToRun: meta?.whenToRun ?? 'Ask your database operator.',
        applied: appliedState,
      }
    })

    return { templates }
  },
)
