import { ArrowsLeftRight, Globe } from '@phosphor-icons/react'
import { useRouter } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { useEffect, useState } from 'react'

import { AdminPageHeader } from '#/components/admin/admin-page-header'
import { AdminTabPanel, AdminUrlTabs } from '#/components/admin/admin-url-tabs'
import { RedirectsHostsPanel } from '#/components/admin/redirects-hosts-panel'
import type { SiteSettingsForm } from '#/lib/cms/site-settings-form'
import {
  deleteUrlRedirectFn,
  exportUrlRedirectsCsvFn,
  importUrlRedirectsCsvFn,
  saveUrlRedirectFn,
  type UrlRedirectRow,
} from '#/lib/cms/redirects-fns'
import { appToast } from '#/lib/app-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

const REDIRECT_TABS = [
  { id: 'rules', label: 'Rules', icon: ArrowsLeftRight },
  { id: 'hosts', label: 'Allowed hosts', icon: Globe },
] as const

export type RedirectsTabId = (typeof REDIRECT_TABS)[number]['id']

export function RedirectsScreen({
  initial,
  siteSettings,
  activeTab,
  onReload,
}: {
  initial: UrlRedirectRow[]
  siteSettings: SiteSettingsForm
  activeTab: RedirectsTabId
  onReload: () => void
}) {
  const router = useRouter()
  const save = useServerFn(saveUrlRedirectFn)
  const remove = useServerFn(deleteUrlRedirectFn)
  const exportCsv = useServerFn(exportUrlRedirectsCsvFn)
  const importCsv = useServerFn(importUrlRedirectsCsvFn)
  const [rows, setRows] = useState(initial)
  useEffect(() => {
    setRows(initial)
  }, [initial])
  const [editing, setEditing] = useState<Partial<UrlRedirectRow> | null>(null)
  const [pending, setPending] = useState(false)

  function startCreate() {
    setEditing({
      from_path: '/old-path',
      to_path: '/new-path',
      status_code: 301,
      enabled: true,
    })
  }

  async function onSave() {
    if (!editing?.from_path || !editing.to_path) {
      return
    }
    setPending(true)
    const result = await save({
      data: {
        id: editing.id,
        fromPath: editing.from_path,
        toPath: editing.to_path,
        statusCode: editing.status_code ?? 301,
        enabled: editing.enabled ?? true,
      },
    })
    if (result.error) {
      appToast.error(result.error)
    } else {
      appToast.success('Redirect saved.')
      setEditing(null)
      onReload()
    }
    setPending(false)
  }

  async function onExport() {
    setPending(true)
    const result = await exportCsv()
    setPending(false)
    const blob = new Blob([result.csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'redirects.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  async function onImportFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) {
      return
    }
    setPending(true)
    const text = await file.text()
    const result = await importCsv({ data: { csv: text } })
    setPending(false)
    if (result.error) {
      appToast.error(result.error)
    } else {
      appToast.success(`Imported ${result.imported} redirects.`)
      onReload()
    }
  }

  async function onDelete(id: string) {
    setPending(true)
    const result = await remove({ data: { id } })
    if (result.error) {
      appToast.error(result.error)
    } else {
      appToast.success('Redirect deleted.')
      setEditing(null)
      onReload()
    }
    setPending(false)
  }

  function setTab(tab: RedirectsTabId) {
    void router.navigate({
      to: '/admin/redirects',
      search: { tab },
    })
  }

  return (
    <div className="admin-page-body grid w-full gap-6">
      <AdminPageHeader
        title="Redirects"
        description="Send visitors from old paths to new ones."
        actions={
          activeTab === 'rules' ? (
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => void onExport()}
              >
                Export CSV
              </Button>
              <Button type="button" size="sm" variant="outline" asChild>
                <label>
                  Import CSV
                  <input
                    type="file"
                    accept=".csv,text/csv"
                    className="sr-only"
                    onChange={(event) => void onImportFile(event)}
                  />
                </label>
              </Button>
              <Button type="button" size="sm" onClick={startCreate}>
                Add redirect
              </Button>
            </div>
          ) : null
        }
      />

      <AdminUrlTabs
        tabs={REDIRECT_TABS}
        activeTab={activeTab}
        onTabChange={(tab) => setTab(tab as RedirectsTabId)}
        ariaLabel="Redirects sections"
      />

      <AdminTabPanel id="rules" activeTab={activeTab}>
        <div className="admin-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>From</TableHead>
                <TableHead>To</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Hits</TableHead>
                <TableHead>Last hit</TableHead>
                <TableHead>Enabled</TableHead>
                <TableHead className="w-[120px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-mono text-xs">
                    {row.from_path}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {row.to_path}
                  </TableCell>
                  <TableCell>{row.status_code}</TableCell>
                  <TableCell>{row.hit_count ?? 0}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {row.last_hit_at
                      ? new Date(row.last_hit_at).toLocaleString()
                      : '—'}
                  </TableCell>
                  <TableCell>{row.enabled ? 'Yes' : 'No'}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditing(row)}
                    >
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {editing ? (
          <section className="admin-card grid gap-4 p-5">
            <h2 className="text-sm font-semibold">
              {editing.id ? 'Edit redirect' : 'New redirect'}
            </h2>
            <div>
              <Label>From path</Label>
              <Input
                value={editing.from_path ?? ''}
                onChange={(event) =>
                  setEditing((e) => ({ ...e, from_path: event.target.value }))
                }
                className="mt-1 font-mono text-xs"
              />
            </div>
            <div>
              <Label>To path</Label>
              <Input
                value={editing.to_path ?? ''}
                onChange={(event) =>
                  setEditing((e) => ({ ...e, to_path: event.target.value }))
                }
                className="mt-1 font-mono text-xs"
              />
            </div>
            <div>
              <Label>Status code</Label>
              <select
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={editing.status_code ?? 301}
                onChange={(event) =>
                  setEditing((e) => ({
                    ...e,
                    status_code: Number(event.target.value) as 301 | 302 | 410,
                  }))
                }
              >
                <option value={301}>301 permanent</option>
                <option value={302}>302 temporary</option>
                <option value={410}>410 gone</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                checked={editing.enabled ?? true}
                onCheckedChange={(checked) =>
                  setEditing((e) => ({ ...e, enabled: checked === true }))
                }
                id="redirect-enabled"
              />
              <Label htmlFor="redirect-enabled">Enabled</Label>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                disabled={pending}
                onClick={() => void onSave()}
              >
                Save
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setEditing(null)}
              >
                Cancel
              </Button>
              {editing.id ? (
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  disabled={pending}
                  onClick={() => {
                    const id = editing.id
                    if (id) {
                      void onDelete(id)
                    }
                  }}
                >
                  Delete
                </Button>
              ) : null}
            </div>
          </section>
        ) : null}
      </AdminTabPanel>

      <AdminTabPanel id="hosts" activeTab={activeTab}>
        <RedirectsHostsPanel initial={siteSettings} />
      </AdminTabPanel>
    </div>
  )
}
