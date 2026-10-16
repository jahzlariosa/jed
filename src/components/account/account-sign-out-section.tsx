import { Link } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { useState } from 'react'

import { signOutFn } from '#/auth'
import { useAuthSubmit } from '#/components/auth/use-auth-submit'
import { clearFetchCache } from '#/lib/deduped-fetch'
import { AccountCard } from '#/components/account/account-confirm-dialog'
import { AccountConfirmDialog } from '#/components/account/account-confirm-dialog'
import { Button } from '@/components/ui/button'

export function AccountSignOutSection({ siteName }: { siteName: string }) {
  const signOut = useServerFn(signOutFn)
  const { pending, run } = useAuthSubmit()
  const [open, setOpen] = useState(false)

  async function onSignOut() {
    await run(async () => {
      clearFetchCache()
      await signOut()
    })
  }

  return (
    <AccountCard id="sign-out" title="Sign out">
      <p className="text-[16px] account-muted">
        Ends your session on this device.
      </p>
      <Button
        type="button"
        variant="outline"
        className="w-fit rounded-xl"
        disabled={pending}
        onClick={() => setOpen(true)}
      >
        Sign out
      </Button>
      <AccountConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={`Sign out of ${siteName}?`}
        description="You can sign in again anytime on this device."
        primaryLabel="Sign out"
        secondaryLabel="Stay signed in"
        pending={pending}
        onPrimary={onSignOut}
      />
    </AccountCard>
  )
}

export function AccountAdminCard() {
  return (
    <AccountCard id="admin" title="Admin">
      <p className="text-[16px] account-muted">
        Manage content, users, and site settings.
      </p>
      <Button asChild className="w-fit rounded-xl">
        <Link to="/admin">Open admin</Link>
      </Button>
    </AccountCard>
  )
}
