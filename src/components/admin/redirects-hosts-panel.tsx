import { Link } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { useEffect, useMemo, useState } from 'react'

import { AdminSectionBlock } from '#/components/admin/admin-section-block'
import { AdminStickySaveBar } from '#/components/admin/admin-sticky-save-bar'
import { saveSiteSettingsFn } from '#/lib/cms/functions'
import { pathsToText } from '#/lib/cms/site-settings-seo'
import {
  normalizeSiteSettingsForm,
  type SiteSettingsForm,
  siteSettingsFormsEqual,
  toSaveSiteSettingsPayload,
} from '#/lib/cms/site-settings-form'
import { appToast } from '#/lib/app-toast'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

export function RedirectsHostsPanel({
  initial,
}: {
  initial: SiteSettingsForm
}) {
  const save = useServerFn(saveSiteSettingsFn)
  const [baseline, setBaseline] = useState(() =>
    normalizeSiteSettingsForm(initial),
  )
  const [form, setForm] = useState(() => normalizeSiteSettingsForm(initial))
  const [pending, setPending] = useState(false)

  useEffect(() => {
    const next = normalizeSiteSettingsForm(initial)
    setBaseline(next)
    setForm(next)
  }, [initial])

  const dirty = useMemo(
    () => !siteSettingsFormsEqual(form, baseline),
    [form, baseline],
  )

  async function onSave() {
    setPending(true)
    const result = await save({ data: toSaveSiteSettingsPayload(form) })
    if (result.error) {
      appToast.error(result.error)
    } else {
      setBaseline(form)
      appToast.success('Settings saved. Your changes are live on the site.')
    }
    setPending(false)
  }

  return (
    <>
      <AdminSectionBlock
        title="External redirect hosts"
        description="HTTPS hosts allowed as targets for URL redirects."
      >
        <div>
          <Label htmlFor="redirect-hosts-allowed">Allowed hosts</Label>
          <textarea
            id="redirect-hosts-allowed"
            value={pathsToText(form.redirect_external_hosts)}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                redirect_external_hosts: event.target.value
                  .split('\n')
                  .map((line) => line.trim())
                  .filter(Boolean),
              }))
            }
            className="mt-1 min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-xs"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            One host per line, without protocol.
          </p>
        </div>
      </AdminSectionBlock>
      <AdminSectionBlock
        title="Manage redirect rules"
        description="Path rules live on the Redirects page."
      >
        <Button type="button" variant="secondary" size="sm" asChild>
          <Link to="/admin/redirects" search={{ tab: 'rules' }}>
            Open Redirects
          </Link>
        </Button>
      </AdminSectionBlock>
      <AdminStickySaveBar
        dirty={dirty}
        saving={pending}
        onDiscard={() => setForm(baseline)}
        onSave={() => void onSave()}
      />
    </>
  )
}
