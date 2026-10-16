import { useState } from 'react'
import { useServerFn } from '@tanstack/react-start'

import { updateAccountPasswordFn } from '#/lib/account/account-fns'
import { AccountCard } from '#/components/account/account-confirm-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function AccountPasswordSection() {
  const updatePassword = useServerFn(updateAccountPasswordFn)
  const [currentPassword, setCurrentPassword] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [pending, setPending] = useState(false)

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError('')
    setSuccess('')
    if (password !== confirm) {
      setError('New passwords do not match')
      return
    }
    setPending(true)
    const result = await updatePassword({
      data: { currentPassword, password },
    })
    if ('error' in result && result.error) {
      setError(result.error)
    } else {
      setSuccess('Password updated.')
      setCurrentPassword('')
      setPassword('')
      setConfirm('')
    }
    setPending(false)
  }

  return (
    <AccountCard id="password" title="Password">
      <form
        className="account-field-gap grid"
        onSubmit={(event) => void onSubmit(event)}
      >
        {error ? (
          <p role="alert" className="text-[15px] text-destructive">
            {error}
          </p>
        ) : null}
        {success ? (
          <p role="status" className="text-[15px] text-foreground">
            {success}
          </p>
        ) : null}
        <div className="grid gap-1.5">
          <Label htmlFor="current-password" className="account-label">
            Current password
          </Label>
          <Input
            id="current-password"
            type="password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            className="h-12 rounded-xl text-[18px]"
            required
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="new-password" className="account-label">
            New password
          </Label>
          <Input
            id="new-password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="h-12 rounded-xl text-[18px]"
            required
            minLength={8}
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="confirm-password" className="account-label">
            Confirm new password
          </Label>
          <Input
            id="confirm-password"
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
            className="h-12 rounded-xl text-[18px]"
            required
            minLength={8}
          />
        </div>
        <Button type="submit" className="w-fit rounded-xl" disabled={pending}>
          {pending ? 'Working...' : 'Update password'}
        </Button>
      </form>
    </AccountCard>
  )
}
