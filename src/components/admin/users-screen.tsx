import { ShieldCheck, Users as UsersIcon } from '@phosphor-icons/react'
import { useRouter } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { useMemo, useState } from 'react'

import { AdminDirectoryPagination } from '#/components/admin/admin-directory-pagination'
import { AdminAddUserDialog } from '#/components/admin/admin-add-user-dialog'
import type {
  UsersAccountStatus,
  UsersDirectoryPageSize,
  UsersMfaFilter,
} from '#/auth/users-directory-query'
import { AccountUserAvatar } from '#/components/account/account-user-avatar'
import { UsersMembersToolbar } from '#/components/admin/users-members-toolbar'
import { RolesCatalogPanel } from '#/components/admin/roles-catalog-panel'
import { AdminPageHeader } from '#/components/admin/admin-page-header'
import { AdminTabPanel, AdminUrlTabs } from '#/components/admin/admin-url-tabs'
import { AdminStatusBadge } from '#/components/admin/admin-status-badge'
import {
  adminSetUserPasswordFn,
  adminSendPasswordResetEmailFn,
  adminUpdateUserEmailFn,
  deleteUserAdminFn,
  type listUsersAdminFn,
  updateUserAdminFn,
} from '#/auth/users-admin'
import { appToast } from '#/lib/app-toast'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

type Directory = Awaited<ReturnType<typeof listUsersAdminFn>> & {
  rolesCatalog: Awaited<
    ReturnType<typeof import('#/auth/roles-admin').listRolesCatalogAdminFn>
  >
}

const USERS_TABS = [
  { id: 'members', label: 'Members', icon: UsersIcon },
  { id: 'roles', label: 'Roles', icon: ShieldCheck },
] as const

export type UsersTabId = (typeof USERS_TABS)[number]['id']

export function UsersScreen({
  directory,
  activeTab,
  q,
  role,
  status,
  mfa,
  createdFrom,
  createdTo,
  page,
  pageSize,
  onSearchChange,
  onRoleChange,
  onStatusChange,
  onMfaChange,
  onCreatedFromChange,
  onCreatedToChange,
  onPageChange,
  onPageSizeChange,
  onReload,
}: {
  directory: Directory
  activeTab: UsersTabId
  q: string
  role?: string
  status?: UsersAccountStatus
  mfa?: UsersMfaFilter
  createdFrom?: string
  createdTo?: string
  page: number
  pageSize: UsersDirectoryPageSize
  onSearchChange: (q: string) => void
  onRoleChange: (role: string | undefined) => void
  onStatusChange: (status: UsersAccountStatus | undefined) => void
  onMfaChange: (mfa: UsersMfaFilter | undefined) => void
  onCreatedFromChange: (value: string | undefined) => void
  onCreatedToChange: (value: string | undefined) => void
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: UsersDirectoryPageSize) => void
  onReload: () => void
}) {
  const router = useRouter()
  const updateUser = useServerFn(updateUserAdminFn)
  const resetUserPassword = useServerFn(adminSetUserPasswordFn)
  const sendResetEmail = useServerFn(adminSendPasswordResetEmailFn)
  const updateUserEmail = useServerFn(adminUpdateUserEmailFn)
  const removeUser = useServerFn(deleteUserAdminFn)

  const [addUserOpen, setAddUserOpen] = useState(false)

  const [passwordUserId, setPasswordUserId] = useState<string | null>(null)
  const [passwordUserLabel, setPasswordUserLabel] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [passwordPending, setPasswordPending] = useState(false)
  const [resetEmailPending, setResetEmailPending] = useState(false)

  const [editUserId, setEditUserId] = useState<string | null>(null)
  const [editEmail, setEditEmail] = useState('')
  const [editName, setEditName] = useState('')
  const [editPending, setEditPending] = useState(false)

  const [deleteTarget, setDeleteTarget] = useState<{
    id: string
    label: string
  } | null>(null)
  const [deletePending, setDeletePending] = useState(false)
  const [editOriginalEmail, setEditOriginalEmail] = useState('')
  const [roleOverrides, setRoleOverrides] = useState<Record<string, string>>({})

  const createRoleOptions = useMemo(() => {
    const fromCatalog = directory.rolesCatalog.roles.map((role) => ({
      code: role.code,
      label: role.name,
    }))
    if (fromCatalog.length > 0) {
      return fromCatalog
    }
    return [
      { code: 'member', label: 'Member' },
      { code: 'admin', label: 'Admin' },
    ]
  }, [directory.rolesCatalog.roles])

  async function onSetPassword() {
    if (!passwordUserId) return
    setPasswordPending(true)
    const result = await resetUserPassword({
      data: { userId: passwordUserId, password: newPassword },
    })
    setPasswordPending(false)
    if (result.error) {
      appToast.error(result.error)
      return
    }
    appToast.success('Password updated.')
    setPasswordUserId(null)
    setNewPassword('')
  }

  async function onSaveEdit() {
    if (!editUserId) return
    setEditPending(true)
    const result = await updateUser({
      data: {
        userId: editUserId,
        displayName: editName || null,
      },
    })
    const emailChanged =
      editEmail.trim().length > 0 && editEmail.trim() !== editOriginalEmail
    if (!result.error && emailChanged) {
      const emailResult = await updateUserEmail({
        data: { userId: editUserId, email: editEmail.trim() },
      })
      if (emailResult.error) {
        setEditPending(false)
        appToast.error(emailResult.error)
        return
      }
    }
    setEditPending(false)
    if (result.error) {
      appToast.error(result.error)
      return
    }
    appToast.success(emailChanged ? 'User updated.' : 'Display name updated.')
    setEditUserId(null)
    onReload()
  }

  async function onConfirmDelete() {
    if (!deleteTarget) return
    setDeletePending(true)
    const result = await removeUser({ data: { userId: deleteTarget.id } })
    setDeletePending(false)
    if (result.error) {
      appToast.error(result.error)
      return
    }
    appToast.success('User deleted.')
    setDeleteTarget(null)
    onReload()
  }

  function setTab(tab: UsersTabId) {
    void router.navigate({
      to: '/admin/users',
      search: {
        tab,
        q: q || undefined,
        role,
        status,
        mfa,
        createdFrom,
        createdTo,
        page,
        pageSize,
      },
    })
  }

  const filterRoleOptions = useMemo(
    () => [
      { code: 'member', label: 'Member' },
      { code: 'admin', label: 'Admin' },
      ...createRoleOptions.filter(
        (option) => option.code !== 'member' && option.code !== 'admin',
      ),
    ],
    [createRoleOptions],
  )

  return (
    <div className="admin-page-roomy grid gap-8">
      <AdminPageHeader
        title="Users and roles"
        description="Invite members and review role permissions."
      />

      <AdminUrlTabs
        tabs={USERS_TABS}
        activeTab={activeTab}
        onTabChange={(tab) => setTab(tab as UsersTabId)}
        ariaLabel="Users and roles sections"
      />

      <AdminTabPanel id="members" activeTab={activeTab}>
        <UsersMembersToolbar
          q={q}
          role={role}
          status={status}
          mfa={mfa}
          createdFrom={createdFrom}
          createdTo={createdTo}
          roleOptions={filterRoleOptions}
          onSearchChange={onSearchChange}
          onRoleChange={onRoleChange}
          onStatusChange={onStatusChange}
          onMfaChange={onMfaChange}
          onCreatedFromChange={onCreatedFromChange}
          onCreatedToChange={onCreatedToChange}
          canAddUser={directory.canManage}
          onAddUser={() => setAddUserOpen(true)}
        />

        <div className="admin-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {directory.users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-muted-foreground">
                    No users match these filters.
                  </TableCell>
                </TableRow>
              ) : (
                directory.users.map((user) => {
                  const storedRole = user.roleCodes.includes('admin')
                    ? 'admin'
                    : (user.roleCodes[0] ?? 'member')
                  const primaryRole = roleOverrides[user.userId] ?? storedRole
                  const label = primaryRole === 'admin' ? 'Admin' : 'Member'
                  const name =
                    user.displayName ?? user.email ?? user.userId.slice(0, 8)
                  return (
                    <TableRow key={user.userId}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <AccountUserAvatar
                            avatarUrl={user.avatarUrl}
                            displayName={user.displayName}
                            email={user.email}
                            size="sm"
                          />
                          <div>
                            <div className="font-medium">{name}</div>
                            <div className="text-xs text-muted-foreground">
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          <AdminStatusBadge
                            status={user.accountStatus}
                            label={accountStatusLabel(user.accountStatus)}
                          />
                          {user.mfaEnabled ? (
                            <AdminStatusBadge status="published" label="MFA" />
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell>
                        <AdminStatusBadge status={primaryRole} label={label} />
                      </TableCell>
                      <TableCell>{formatDate(user.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        {directory.canManage ? (
                          <div className="flex flex-wrap justify-end gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditUserId(user.userId)
                                setEditEmail(user.email ?? '')
                                setEditOriginalEmail(user.email ?? '')
                                setEditName(user.displayName ?? '')
                              }}
                            >
                              Edit
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setPasswordUserId(user.userId)
                                setPasswordUserLabel(name)
                                setNewPassword('')
                              }}
                            >
                              Set password
                            </Button>
                            <select
                              className="rounded-md border border-input bg-background px-2 py-1 text-sm"
                              value={primaryRole}
                              disabled={user.userId === directory.viewerId}
                              onChange={(event) => {
                                const nextRole = event.target.value
                                setRoleOverrides((current) => ({
                                  ...current,
                                  [user.userId]: nextRole,
                                }))
                                void updateUser({
                                  data: {
                                    userId: user.userId,
                                    roleCode: nextRole,
                                  },
                                })
                                  .then((result) => {
                                    if (result.error) {
                                      setRoleOverrides((current) => {
                                        const next = { ...current }
                                        delete next[user.userId]
                                        return next
                                      })
                                      appToast.error(result.error)
                                      return
                                    }
                                    appToast.success('Role updated.')
                                    onReload()
                                  })
                                  .catch(() => {
                                    setRoleOverrides((current) => {
                                      const next = { ...current }
                                      delete next[user.userId]
                                      return next
                                    })
                                    appToast.error('Unable to update role')
                                  })
                              }}
                              aria-label={`Role for ${user.email ?? 'member'}`}
                            >
                              {createRoleOptions.map((option) => (
                                <option key={option.code} value={option.code}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              disabled={user.userId === directory.viewerId}
                              onClick={() =>
                                setDeleteTarget({
                                  id: user.userId,
                                  label: name,
                                })
                              }
                            >
                              Delete
                            </Button>
                          </div>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
        <AdminDirectoryPagination
          page={directory.page}
          pageSize={directory.pageSize}
          pageCount={directory.pageCount}
          total={directory.total}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
        />
      </AdminTabPanel>

      <AdminTabPanel id="roles" activeTab={activeTab}>
        <RolesCatalogPanel
          roles={directory.rolesCatalog.roles}
          permissions={directory.rolesCatalog.permissions}
          canManageRoles={directory.rolesCatalog.canManageRoles}
          onReload={onReload}
        />
      </AdminTabPanel>

      <AdminAddUserDialog
        open={addUserOpen}
        onOpenChange={setAddUserOpen}
        onCreated={onReload}
        roleOptions={createRoleOptions}
      />

      <Dialog
        open={passwordUserId !== null}
        onOpenChange={(open) => {
          if (!open) setPasswordUserId(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set password</DialogTitle>
            <DialogDescription>
              New password for {passwordUserLabel}.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <Label htmlFor="member-new-password">New password</Label>
            <Input
              id="member-new-password"
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              minLength={8}
            />
          </div>
          <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
            <Button
              type="button"
              variant="secondary"
              loading={resetEmailPending}
              disabled={resetEmailPending || !passwordUserId}
              onClick={() => {
                if (!passwordUserId) return
                setResetEmailPending(true)
                void sendResetEmail({ data: { userId: passwordUserId } }).then(
                  (result) => {
                    setResetEmailPending(false)
                    if ('error' in result && result.error) {
                      appToast.error(result.error)
                      return
                    }
                    appToast.success('Reset email sent if the address exists.')
                  },
                )
              }}
            >
              Send reset email
            </Button>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setPasswordUserId(null)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                loading={passwordPending}
                disabled={passwordPending || newPassword.length < 8}
                onClick={() => void onSetPassword()}
              >
                Save
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={editUserId !== null}
        onOpenChange={(open) => {
          if (!open) setEditUserId(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit user</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div>
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="edit-name">Display name</Label>
              <Input
                id="edit-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditUserId(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              loading={editPending}
              disabled={editPending}
              onClick={() => void onSaveEdit()}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete user?</DialogTitle>
            <DialogDescription>
              This removes {deleteTarget?.label} and cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteTarget(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              loading={deletePending}
              disabled={deletePending}
              onClick={() => void onConfirmDelete()}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function accountStatusLabel(status: UsersAccountStatus): string {
  if (status === 'banned') {
    return 'Banned'
  }
  if (status === 'unconfirmed') {
    return 'Unconfirmed'
  }
  return 'Active'
}
