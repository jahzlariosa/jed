import { SignOut, SquaresFour, UserCircle } from '@phosphor-icons/react'
import { Link } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { useEffect, useState } from 'react'

import { getSessionFn, PERMISSIONS, signOutFn } from '#/auth'
import { getAccountMenuFn } from '#/lib/account/account-fns'
import { profileDisplayLabel } from '#/lib/account/account-initials'
import { AccountUserAvatar } from '#/components/account/account-user-avatar'
import { clearFetchCache } from '#/lib/deduped-fetch'
import { useAuthSubmit } from '#/components/auth/use-auth-submit'
import { phosphorIcon } from '#/lib/icon'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function MarketingNavSession({ className }: { className?: string }) {
  const loadSession = useServerFn(getSessionFn)
  const loadMenu = useServerFn(getAccountMenuFn)
  const signOut = useServerFn(signOutFn)
  const { pending, run } = useAuthSubmit()

  const [signedIn, setSignedIn] = useState(false)
  const [admin, setAdmin] = useState(false)
  const [menu, setMenu] = useState<{
    email: string | null
    displayName: string | null
    avatarUrl: string | null
  } | null>(null)

  useEffect(() => {
    let cancelled = false
    void loadSession()
      .then((session) => {
        if (cancelled) {
          return
        }
        const isIn = Boolean(session?.user)
        setSignedIn(isIn)
        setAdmin(
          Boolean(
            session?.access.permissions.includes(PERMISSIONS.adminAccess),
          ),
        )
        if (isIn) {
          void loadMenu().then((row) => {
            if (!cancelled && row) {
              setMenu(row)
            }
          })
        } else {
          setMenu(null)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSignedIn(false)
          setAdmin(false)
          setMenu(null)
        }
      })
    return () => {
      cancelled = true
    }
  }, [loadSession, loadMenu])

  async function onSignOut() {
    await run(async () => {
      clearFetchCache()
      await signOut()
    })
  }

  if (signedIn) {
    const label = profileDisplayLabel({
      displayName: menu?.displayName ?? null,
      email: menu?.email ?? null,
    })
    return (
      <div className={className}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-2 rounded-xl px-2 py-1.5 text-sm font-medium hover:bg-muted/60"
              aria-label="Account menu"
            >
              <AccountUserAvatar
                avatarUrl={menu?.avatarUrl ?? null}
                displayName={menu?.displayName ?? null}
                email={menu?.email ?? null}
                size="sm"
              />
              <span className="hidden max-w-[9rem] truncate md:inline">
                {label}
              </span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="rounded-xl">
            <DropdownMenuItem asChild>
              <Link to="/account" className="flex items-center gap-2">
                <UserCircle
                  {...phosphorIcon}
                  className="size-4 text-muted-foreground"
                />
                Account
              </Link>
            </DropdownMenuItem>
            {admin ? (
              <DropdownMenuItem asChild>
                <Link to="/admin" className="flex items-center gap-2">
                  <SquaresFour
                    {...phosphorIcon}
                    className="size-4 text-muted-foreground"
                  />
                  Admin
                </Link>
              </DropdownMenuItem>
            ) : null}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              disabled={pending}
              onClick={() => void onSignOut()}
              className="flex items-center gap-2"
            >
              <SignOut
                {...phosphorIcon}
                className="size-4 text-muted-foreground"
              />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    )
  }

  return (
    <div className={className}>
      <Link
        to="/login"
        className="marketing-btn-ghost-sm marketing-guest-action"
      >
        Sign in
      </Link>
      <Link
        to="/docs/$slug"
        params={{ slug: 'getting-started' }}
        className="marketing-btn-brand marketing-guest-action"
      >
        Get started
      </Link>
    </div>
  )
}
