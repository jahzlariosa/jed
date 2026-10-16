import { useState } from 'react'

import { AdminPageHeader } from '#/components/admin/admin-page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { appToast } from '#/lib/app-toast'

type Template = {
  id: string
  filename: string
  sql: string
  group: 'migration' | 'seed'
  version: string
  summary: string
  whenToRun: string
  applied: 'applied' | 'pending' | 'n/a'
}

export function SqlTemplatesScreen({ templates }: { templates: Template[] }) {
  const [openId, setOpenId] = useState<string | null>(null)

  async function copySql(sql: string) {
    try {
      await navigator.clipboard.writeText(sql)
      appToast.success('SQL copied.')
    } catch {
      appToast.error('Unable to copy.')
    }
  }

  return (
    <div className="grid gap-6">
      <AdminPageHeader
        title="SQL templates"
        description="Reference copies of migrations and seed SQL. Nothing here runs against your database."
      />
      <ul className="grid gap-4">
        {templates.map((item) => {
          const open = openId === item.id
          return (
            <li key={item.id} className="admin-card overflow-hidden">
              <div className="flex flex-wrap items-start justify-between gap-3 p-5">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-mono text-sm font-semibold">
                      {item.filename}
                    </h2>
                    <AppliedBadge state={item.applied} />
                    <Badge variant="outline" className="capitalize">
                      {item.group}
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {item.summary}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    When to run: {item.whenToRun}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => void copySql(item.sql)}
                  >
                    Copy SQL
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => setOpenId(open ? null : item.id)}
                  >
                    {open ? 'Hide' : 'View SQL'}
                  </Button>
                </div>
              </div>
              {open ? (
                <pre className="max-h-[28rem] overflow-auto border-t border-border bg-muted/40 p-4 text-xs leading-relaxed">
                  <code>{item.sql}</code>
                </pre>
              ) : null}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function AppliedBadge({ state }: { state: Template['applied'] }) {
  if (state === 'n/a') {
    return <Badge variant="secondary">Seed file</Badge>
  }
  if (state === 'applied') {
    return <Badge variant="secondary">Applied</Badge>
  }
  return <Badge variant="outline">Not applied</Badge>
}
