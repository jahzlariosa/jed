import { Link } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import {
  ArrowSquareOut,
  List,
  MagnifyingGlass,
  SidebarSimple,
  SignOut,
} from '@phosphor-icons/react'
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react'

import { MAIN_CONTENT_ID, SkipLink } from '#/components/a11y/skip-link'
import { ADMIN_NAV_GROUPS } from '#/components/admin/admin-nav'
import { AdminBreadcrumbs } from '#/components/admin/admin-breadcrumbs'
import { prefetchLazyData } from '#/components/admin/lazy-page'
import { listMediaFn } from '#/lib/cms/functions'
import { AdminCommandMenu } from '#/components/admin/command-menu'
import { AdminThemeMenuItems } from '#/components/admin/admin-theme-menu'
import { useAdminTheme } from '#/components/admin/use-admin-theme'
import { signOutFn, type Permission } from '#/auth'
import { displayRoleLabel } from '#/lib/cms/access'
import { applyBrandCss } from '#/lib/cms/brand'
import { resolvePublicBrandHex } from '#/lib/cms/brand-defaults'
import { phosphorIcon } from '#/lib/icon'
import { clearFetchCache } from '#/lib/deduped-fetch'
import '#/styles/admin.css'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

const SIDEBAR_COLLAPSED_KEY = 'amianan-admin-sidebar-collapsed'

function readSidebarCollapsed(): boolean {
  if (typeof window === 'undefined') {
    return false
  }
  try {
    return window.localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === '1'
  } catch {
    return false
  }
}

function SidebarBrand({
  siteName,
  logoUrl,
  collapsed,
}: {
  siteName: string
  logoUrl: string | null
  collapsed: boolean
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-2.5 px-2.5 pb-4 pt-2',
        collapsed && 'justify-center px-2',
      )}
    >
      {logoUrl ? (
        <img
          src={logoUrl}
          alt=""
          className="size-8 shrink-0 rounded-[10px] object-cover"
          width={32}
          height={32}
        />
      ) : (
        <div
          className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-border bg-card text-sm font-bold text-foreground"
          aria-hidden
        >
          {siteName.slice(0, 1).toUpperCase()}
        </div>
      )}
      {!collapsed ? (
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-foreground">
            {siteName}
          </div>
          <div className="text-xs text-muted-foreground">Admin</div>
        </div>
      ) : null}
    </div>
  )
}

function SidebarNav({
  permissions,
  collapsed,
  onNavigate,
}: {
  permissions: Permission[]
  collapsed: boolean
  onNavigate?: () => void
}) {
  return (
    <div className="flex flex-col gap-4 px-2">
      {ADMIN_NAV_GROUPS.map((group) => {
        const items = group.items.filter((item) =>
          permissions.includes(item.permission),
        )
        if (items.length === 0) {
          return null
        }
        return (
          <div key={group.label}>
            {!collapsed ? (
              <p className="admin-nav-label">{group.label}</p>
            ) : null}
            <nav
              aria-label={group.label}
              className="mt-1 flex flex-col gap-0.5"
            >
              {items.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    preload="intent"
                    activeOptions={{ exact: item.exact }}
                    activeProps={{ className: 'active' }}
                    onClick={onNavigate}
                    onMouseEnter={() => {
                      if (item.to === '/admin/media') {
                        prefetchLazyData('admin:media', () =>
                          listMediaFn({ data: { limit: 80 } }),
                        )
                      }
                    }}
                    className={cn(
                      'admin-nav-link',
                      collapsed && 'admin-nav-link-collapsed',
                    )}
                    title={collapsed ? item.label : undefined}
                  >
                    <Icon
                      {...phosphorIcon}
                      className="size-4 shrink-0 text-current"
                      aria-hidden
                    />
                    {!collapsed ? (
                      <span className="truncate">{item.label}</span>
                    ) : (
                      <span className="sr-only">{item.label}</span>
                    )}
                  </Link>
                )
              })}
            </nav>
          </div>
        )
      })}
    </div>
  )
}

function SidebarUser({
  email,
  roles,
  permissions,
  collapsed,
}: {
  email: string | null
  roles: string[]
  permissions: Permission[]
  collapsed: boolean
}) {
  const initials = email?.slice(0, 2).toUpperCase() ?? 'AD'
  const roleLabel = displayRoleLabel(roles, permissions)
  return (
    <div
      className={cn(
        'mt-auto flex items-center gap-2.5 border-t border-border px-3 py-4',
        collapsed && 'justify-center px-2',
      )}
    >
      <div
        className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-muted text-xs font-semibold text-foreground"
        aria-hidden
      >
        {initials}
      </div>
      {!collapsed ? (
        <div className="min-w-0">
          <div className="truncate text-sm font-medium text-foreground">
            Admin
          </div>
          <div className="truncate text-xs text-muted-foreground">
            {roleLabel}
          </div>
        </div>
      ) : null}
    </div>
  )
}

export function AdminShell({
  email,
  roles,
  permissions,
  branding,
  children,
}: {
  email: string | null
  roles: string[]
  permissions: Permission[]
  branding: { siteName: string; brandHex: string; logoUrl: string | null }
  children: ReactNode
}) {
  const signOut = useServerFn(signOutFn)
  const { resolved: theme } = useAdminTheme()
  const [menuOpen, setMenuOpen] = useState(false)
  const [commandOpen, setCommandOpen] = useState(false)
  const [pending, setPending] = useState(false)
  const [modKeyLabel, setModKeyLabel] = useState('Ctrl')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(readSidebarCollapsed)
  const mountedRef = useRef(true)

  const brandStyle = applyBrandCss(
    resolvePublicBrandHex(branding.brandHex),
  ) as CSSProperties

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  useEffect(() => {
    if (typeof navigator !== 'undefined' && /Mac/i.test(navigator.platform)) {
      setModKeyLabel('⌘')
    }
  }, [])

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setCommandOpen(true)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  function toggleSidebar() {
    setSidebarCollapsed((current) => {
      const next = !current
      try {
        window.localStorage.setItem(SIDEBAR_COLLAPSED_KEY, next ? '1' : '0')
      } catch {
        // ignore
      }
      return next
    })
  }

  async function onSignOut() {
    setPending(true)
    try {
      clearFetchCache()
      await signOut()
    } finally {
      if (mountedRef.current) {
        setPending(false)
      }
    }
  }

  return (
    <div
      className={cn(
        'amianan-admin min-h-dvh',
        sidebarCollapsed && 'admin-shell-collapsed',
      )}
      style={brandStyle}
      data-theme={theme}
    >
      <SkipLink />
      <AdminCommandMenu
        open={commandOpen}
        onOpenChange={setCommandOpen}
        permissions={permissions}
      />
      <div className="flex min-h-dvh">
        <aside
          className="admin-sidebar hidden shrink-0 flex-col border-r md:flex"
          aria-label="Admin sidebar"
        >
          <div className="px-3 pt-4">
            <SidebarBrand
              siteName={branding.siteName}
              logoUrl={branding.logoUrl}
              collapsed={sidebarCollapsed}
            />
          </div>
          <div className="px-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className={cn(
                'admin-sidebar-collapse mb-2 w-full gap-1.5',
                sidebarCollapsed && 'px-0',
              )}
              onClick={toggleSidebar}
              aria-expanded={!sidebarCollapsed}
              aria-label={
                sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'
              }
            >
              <SidebarSimple
                {...phosphorIcon}
                className="size-4 shrink-0 text-current"
                aria-hidden
              />
              {!sidebarCollapsed ? <span>Collapse</span> : null}
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto py-2">
            <SidebarNav
              permissions={permissions}
              collapsed={sidebarCollapsed}
            />
          </div>
          <SidebarUser
            email={email}
            roles={roles}
            permissions={permissions}
            collapsed={sidebarCollapsed}
          />
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="admin-topbar sticky top-0 z-20 flex min-w-0 items-center gap-3 border-b">
            <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
              <SheetTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-9 shrink-0 md:hidden"
                  aria-label="Open menu"
                >
                  <List {...phosphorIcon} className="size-5 text-current" />
                </Button>
              </SheetTrigger>
              <SheetContent
                side="left"
                className="admin-sidebar w-72 border-r p-0"
              >
                <SheetHeader className="border-b border-border pb-4 text-left">
                  <SheetTitle>{branding.siteName}</SheetTitle>
                </SheetHeader>
                <div className="flex h-[calc(100%-3.5rem)] flex-col py-3">
                  <SidebarNav
                    permissions={permissions}
                    collapsed={false}
                    onNavigate={() => setMenuOpen(false)}
                  />
                  <SidebarUser
                    email={email}
                    roles={roles}
                    permissions={permissions}
                    collapsed={false}
                  />
                </div>
              </SheetContent>
            </Sheet>

            <button
              type="button"
              className="admin-search-trigger hidden md:flex"
              onClick={() => setCommandOpen(true)}
              aria-label="Open command palette"
            >
              <MagnifyingGlass
                {...phosphorIcon}
                className="size-4 shrink-0 text-current"
                aria-hidden
              />
              <span className="flex-1 truncate text-left">
                Search content, media, users…
              </span>
              <kbd className="hidden rounded border border-border bg-muted px-1.5 py-0.5 font-sans text-[10px] font-medium text-muted-foreground lg:inline">
                {modKeyLabel}K
              </kbd>
            </button>

            <div className="ml-auto flex shrink-0 items-center gap-1.5">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="size-9 md:hidden"
                onClick={() => setCommandOpen(true)}
                aria-label="Open command palette"
              >
                <MagnifyingGlass
                  {...phosphorIcon}
                  className="size-4 text-current"
                />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="hidden gap-1.5 sm:inline-flex"
                asChild
              >
                <a href="/" target="_blank" rel="noopener noreferrer">
                  <ArrowSquareOut
                    {...phosphorIcon}
                    className="size-4 text-current"
                    aria-hidden
                  />
                  View site
                </a>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="max-w-[10rem] truncate"
                  >
                    {email ?? 'Account'}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Signed in</DropdownMenuLabel>
                  <AdminThemeMenuItems />
                  <DropdownMenuItem asChild>
                    <Link to="/account">Account settings</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    disabled={pending}
                    onClick={() => void onSignOut()}
                  >
                    <SignOut
                      {...phosphorIcon}
                      className="size-4 text-current"
                      aria-hidden
                    />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          <main
            id={MAIN_CONTENT_ID}
            tabIndex={-1}
            className="admin-canvas flex-1 outline-none"
          >
            <div className="admin-page w-full">
              <div className="admin-page-layout">
                <AdminBreadcrumbs />
                <div className="admin-page-main">{children}</div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
