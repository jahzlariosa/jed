import { Code, ChartLine, Key } from '@phosphor-icons/react'
import { useRouter } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { useEffect, useMemo, useState } from 'react'

import { AdminSectionBlock } from '#/components/admin/admin-section-block'
import { AdminTabPanel, AdminUrlTabs } from '#/components/admin/admin-url-tabs'
import { PERMISSIONS, type Permission } from '#/auth'
import {
  createApiTokenFn,
  getApiMintStatusFn,
  listApiTokenUsageFn,
  listApiTokensFn,
  revokeApiTokenFn,
} from '#/auth/api-tokens-fns'
import { AdminPageHeader } from '#/components/admin/admin-page-header'
import { appToast } from '#/lib/app-toast'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const API_TABS = [
  { id: 'tokens', label: 'Tokens', icon: Key },
  { id: 'usage', label: 'Usage', icon: ChartLine },
  { id: 'clients', label: 'Clients', icon: Code },
] as const

export type ApiAccessTabId = (typeof API_TABS)[number]['id']

const SCOPE_LABELS: Record<Permission, string> = {
  [PERMISSIONS.adminAccess]: 'Admin access',
  [PERMISSIONS.contentRead]: 'Content read',
  [PERMISSIONS.contentWrite]: 'Content write',
  [PERMISSIONS.mediaRead]: 'Media read',
  [PERMISSIONS.mediaWrite]: 'Media write',
  [PERMISSIONS.settingsRead]: 'Settings read',
  [PERMISSIONS.settingsWrite]: 'Settings write',
  [PERMISSIONS.profilesReadAll]: 'Profiles read',
  [PERMISSIONS.rolesReadAll]: 'Roles read',
  [PERMISSIONS.rolesManage]: 'Roles manage',
}

export function ApiAccessScreen({
  permissions,
  appUrl,
  activeTab,
}: {
  permissions: Permission[]
  appUrl: string
  activeTab: ApiAccessTabId
}) {
  const router = useRouter()
  const listTokens = useServerFn(listApiTokensFn)
  const listUsage = useServerFn(listApiTokenUsageFn)
  const createToken = useServerFn(createApiTokenFn)
  const revokeToken = useServerFn(revokeApiTokenFn)
  const mintStatus = useServerFn(getApiMintStatusFn)

  const [items, setItems] = useState<
    Awaited<ReturnType<typeof listApiTokensFn>>['items']
  >([])
  const [mintOk, setMintOk] = useState(true)
  const [name, setName] = useState('')
  const [expiresInDays, setExpiresInDays] = useState('90')
  const [scopes, setScopes] = useState<Permission[]>([PERMISSIONS.contentRead])
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const [createdSecret, setCreatedSecret] = useState<string | null>(null)
  const [usage, setUsage] = useState<
    Awaited<ReturnType<typeof listApiTokenUsageFn>>['items']
  >([])

  const origin = appUrl

  const mcpConfig = useMemo(
    () =>
      JSON.stringify(
        {
          mcpServers: {
            jed: {
              url: `${origin}/api/mcp`,
              headers: {
                Authorization: 'Bearer YOUR_TOKEN_HERE',
              },
            },
          },
        },
        null,
        2,
      ),
    [origin],
  )

  const availableScopes = permissions.filter((p) => SCOPE_LABELS[p])

  useEffect(() => {
    let cancelled = false
    void Promise.all([listTokens(), mintStatus(), listUsage()]).then(
      ([list, status, usageResult]) => {
        if (!cancelled) {
          setItems(list.items)
          setMintOk(status.ok)
          setUsage(usageResult.items)
        }
      },
    )
    return () => {
      cancelled = true
    }
  }, [listTokens, listUsage, mintStatus])

  async function refresh() {
    const [list, status, usageResult] = await Promise.all([
      listTokens(),
      mintStatus(),
      listUsage(),
    ])
    setItems(list.items)
    setMintOk(status.ok)
    setUsage(usageResult.items)
  }

  function toggleScope(scope: Permission) {
    setScopes((current) =>
      current.includes(scope)
        ? current.filter((s) => s !== scope)
        : [...current, scope],
    )
  }

  async function onCreate(event: React.FormEvent) {
    event.preventDefault()
    setError('')
    setCreatedSecret(null)
    setPending(true)
    const result = await createToken({
      data: {
        name,
        expiresInDays: Number.parseInt(expiresInDays, 10) || 90,
        scopes,
      },
    })
    if ('error' in result && result.error) {
      setError(result.error)
    } else if ('token' in result) {
      setCreatedSecret(result.token)
      setName('')
      appToast.success(
        'Token created. Copy it now. It will not be shown again.',
      )
      await refresh()
    }
    setPending(false)
  }

  async function onRevoke(id: string) {
    setPending(true)
    const result = await revokeToken({ data: { id } })
    if ('error' in result && result.error) {
      appToast.error(result.error)
    } else {
      appToast.success('Token revoked.')
      await refresh()
    }
    setPending(false)
  }

  async function copyText(value: string, label: string) {
    try {
      await navigator.clipboard.writeText(value)
      appToast.success(`${label} copied.`)
    } catch {
      appToast.error('Unable to copy.')
    }
  }

  function setTab(tab: ApiAccessTabId) {
    void router.navigate({
      to: '/admin/api',
      search: { tab },
    })
  }

  return (
    <div className="admin-page-body flex w-full flex-col gap-6">
      <AdminPageHeader
        title="API and MCP"
        description="Create personal access tokens for REST and MCP clients. Tokens use your permissions and never bypass row-level security."
      />

      <AdminUrlTabs
        tabs={API_TABS}
        activeTab={activeTab}
        onTabChange={(tab) => setTab(tab as ApiAccessTabId)}
        ariaLabel="API and MCP sections"
      />

      {!mintOk ? (
        <p role="alert" className="text-sm text-destructive">
          Token auth is not ready on this deployment. Set SUPABASE_JWT_SECRET in
          Vercel (Project Settings, Environment Variables) using the JWT secret
          from Supabase Project Settings, API, JWT Keys.
        </p>
      ) : null}

      <AdminTabPanel id="tokens" activeTab={activeTab}>
        <AdminSectionBlock title="New token">
          <section className="grid gap-4">
            {error ? (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            ) : null}
            <form className="grid gap-4" onSubmit={(e) => void onCreate(e)}>
              <div className="grid gap-1.5">
                <Label htmlFor="token-name">Name</Label>
                <Input
                  id="token-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={120}
                  required
                  className="admin-input-tall w-full max-w-xl"
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="token-expiry">Expires in days</Label>
                <Input
                  id="token-expiry"
                  type="number"
                  min={1}
                  max={365}
                  value={expiresInDays}
                  onChange={(e) => setExpiresInDays(e.target.value)}
                  className="max-w-[8rem]"
                />
              </div>
              <div className="grid gap-2">
                <p className="text-sm font-medium">Scopes</p>
                <ul className="grid gap-2 sm:grid-cols-2">
                  {availableScopes.map((scope) => (
                    <li key={scope} className="flex items-center gap-2">
                      <Checkbox
                        id={`scope-${scope}`}
                        checked={scopes.includes(scope)}
                        onCheckedChange={() => toggleScope(scope)}
                      />
                      <Label htmlFor={`scope-${scope}`} className="font-normal">
                        {SCOPE_LABELS[scope] ?? scope}
                      </Label>
                    </li>
                  ))}
                </ul>
              </div>
              <Button type="submit" disabled={pending || !mintOk}>
                Create token
              </Button>
            </form>
            {createdSecret ? (
              <div className="grid gap-2 rounded-lg border border-border bg-muted/30 p-3">
                <p className="text-sm font-medium">Copy your token now</p>
                <code className="break-all text-xs">{createdSecret}</code>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-fit"
                  onClick={() => void copyText(createdSecret, 'Token')}
                >
                  Copy token
                </Button>
              </div>
            ) : null}
          </section>
        </AdminSectionBlock>

        <AdminSectionBlock title="Active tokens">
          <section className="grid gap-3">
            {items.length === 0 ? (
              <p className="text-sm text-muted-foreground">No tokens yet.</p>
            ) : (
              <ul className="divide-y rounded-xl border border-border">
                {items.map((row) => {
                  const revoked = Boolean(row.revoked_at)
                  const expired = new Date(row.expires_at) < new Date()
                  return (
                    <li
                      key={row.id}
                      className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm"
                    >
                      <div>
                        <p className="font-medium">{row.name}</p>
                        <p className="font-mono text-xs text-muted-foreground">
                          {row.prefix}…
                        </p>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {(row.scopes ?? []).map((scope) => (
                            <Badge key={scope} variant="secondary">
                              {scope}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {revoked ? (
                          <Badge variant="outline">Revoked</Badge>
                        ) : expired ? (
                          <Badge variant="outline">Expired</Badge>
                        ) : (
                          <Badge variant="secondary">Active</Badge>
                        )}
                        {!revoked && !expired ? (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={pending}
                            onClick={() => void onRevoke(row.id)}
                          >
                            Revoke
                          </Button>
                        ) : null}
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>
        </AdminSectionBlock>
      </AdminTabPanel>

      <AdminTabPanel id="usage" activeTab={activeTab}>
        <AdminSectionBlock
          title="API usage"
          description="Call counts from the audit log for each of your tokens."
        >
          <section className="grid gap-3">
            {usage.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No API calls recorded yet.
              </p>
            ) : (
              <ul className="divide-y rounded-xl border border-border">
                {usage.map((row) => (
                  <li
                    key={row.tokenId}
                    className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm"
                  >
                    <div>
                      <p className="font-medium">{row.tokenName}</p>
                      <p className="text-xs text-muted-foreground">
                        {row.callCount} call{row.callCount === 1 ? '' : 's'}
                        {row.lastCalledAt
                          ? ` · Last used ${new Date(row.lastCalledAt).toLocaleString()}`
                          : ''}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </AdminSectionBlock>
      </AdminTabPanel>

      <AdminTabPanel id="clients" activeTab={activeTab}>
        <AdminSectionBlock
          title="MCP client config"
          description="Replace YOUR_TOKEN_HERE with a token you created above."
        >
          <section className="grid gap-2">
            <pre className="overflow-x-auto rounded-xl border border-border bg-muted/30 p-3 text-xs">
              {mcpConfig}
            </pre>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-fit"
              onClick={() => void copyText(mcpConfig, 'MCP config')}
            >
              Copy MCP JSON
            </Button>
          </section>
        </AdminSectionBlock>

        <AdminSectionBlock
          title="OAuth for MCP"
          description="Third-party OAuth for MCP is not available on this site yet. Use a personal access token instead. The placeholder endpoint documents the current behavior for client authors."
        >
          <section className="grid gap-2">
            <a
              href={`${origin}/api/mcp/oauth`}
              className="text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              {origin}/api/mcp/oauth
            </a>
          </section>
        </AdminSectionBlock>

        <AdminSectionBlock
          title="OpenAPI"
          description="Machine-readable spec for REST clients."
        >
          <section className="grid gap-2">
            <a
              href={`${origin}/api/v1/openapi.json`}
              className="text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              {origin}/api/v1/openapi.json
            </a>
          </section>
        </AdminSectionBlock>
      </AdminTabPanel>
    </div>
  )
}
