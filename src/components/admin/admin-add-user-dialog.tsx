import { useServerFn } from '@tanstack/react-start'
import { useEffect, useState } from 'react'

import { createUserAdminFn } from '#/auth/users-admin'
import {
  addUserSubmitLabel,
  addUserSuccessMessage,
  buildCreateUserPayload,
  createEmptyAddUserForm,
  type AddUserFormValues,
} from '#/lib/admin/add-user-form'
import { appToast } from '#/lib/app-toast'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function AdminAddUserDialog({
  open,
  onOpenChange,
  onCreated,
  roleOptions,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: () => void
  roleOptions: Array<{ code: string; label: string }>
}) {
  const createUser = useServerFn(createUserAdminFn)
  const [form, setForm] = useState<AddUserFormValues>(createEmptyAddUserForm)
  const [pending, setPending] = useState(false)

  useEffect(() => {
    if (!open) {
      setForm(createEmptyAddUserForm())
      setPending(false)
    }
  }, [open])

  function updateForm(patch: Partial<AddUserFormValues>) {
    setForm((current) => ({ ...current, ...patch }))
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    setPending(true)
    const result = await createUser({
      data: buildCreateUserPayload(form),
    })
    setPending(false)
    if (result.error) {
      appToast.error(result.error)
      return
    }
    appToast.success(addUserSuccessMessage(form.invite))
    onOpenChange(false)
    onCreated()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={(event) => void onSubmit(event)}>
          <DialogHeader>
            <DialogTitle>Add user</DialogTitle>
            <DialogDescription>
              Invite by email or create an account with a password.
            </DialogDescription>
          </DialogHeader>
          <DialogBody className="grid gap-3 py-4">
            <div>
              <Label htmlFor="create-email">Email</Label>
              <Input
                id="create-email"
                type="email"
                required
                autoComplete="email"
                value={form.email}
                onChange={(event) => updateForm({ email: event.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="create-name">Display name</Label>
              <Input
                id="create-name"
                value={form.displayName}
                onChange={(event) =>
                  updateForm({ displayName: event.target.value })
                }
                className="mt-1"
                autoComplete="name"
              />
            </div>
            <div>
              <Label htmlFor="create-role">Role</Label>
              <select
                id="create-role"
                className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={form.roleCode}
                onChange={(event) =>
                  updateForm({ roleCode: event.target.value })
                }
              >
                {roleOptions.map((role) => (
                  <option key={role.code} value={role.code}>
                    {role.label}
                  </option>
                ))}
              </select>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.invite}
                onChange={(event) =>
                  updateForm({ invite: event.target.checked })
                }
              />
              Send invite email (no password)
            </label>
            {!form.invite ? (
              <div>
                <Label htmlFor="create-password">Password</Label>
                <Input
                  id="create-password"
                  type="password"
                  minLength={8}
                  required
                  autoComplete="new-password"
                  value={form.password}
                  onChange={(event) =>
                    updateForm({ password: event.target.value })
                  }
                  className="mt-1"
                />
              </div>
            ) : null}
          </DialogBody>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" loading={pending} disabled={pending}>
              {addUserSubmitLabel(form.invite)}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
