import { PencilSimple, Plus, Trash } from '@phosphor-icons/react'
import { useServerFn } from '@tanstack/react-start'
import { useMemo, useState } from 'react'

import type { RoleCatalogRow } from '#/auth/roles-admin-logic'
import {
  createRoleAdminFn,
  deleteRoleAdminFn,
  updateRoleAdminFn,
} from '#/auth/roles-admin'
import type { Permission } from '#/auth/permissions'
import { appToast } from '#/lib/app-toast'
import { phosphorIcon } from '#/lib/icon'
import { AdminSectionBlock } from '#/components/admin/admin-section-block'
import { AdminStatusBadge } from '#/components/admin/admin-status-badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

type PermissionRow = { code: Permission; description: string }

export function RolesCatalogPanel({
  roles,
  permissions,
  canManageRoles,
  onReload,
}: {
  roles: RoleCatalogRow[]
  permissions: PermissionRow[]
  canManageRoles: boolean
  onReload: () => void
}) {
  const createRole = useServerFn(createRoleAdminFn)
  const updateRole = useServerFn(updateRoleAdminFn)
  const removeRole = useServerFn(deleteRoleAdminFn)

  const [createOpen, setCreateOpen] = useState(false)
  const [editRole, setEditRole] = useState<RoleCatalogRow | null>(null)
  const [deleteRole, setDeleteRole] = useState<RoleCatalogRow | null>(null)

  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [selectedPermissions, setSelectedPermissions] = useState<
    Set<Permission>
  >(new Set())
  const [reassignCode, setReassignCode] = useState('member')
  const [pending, setPending] = useState(false)

  const permissionLabel = useMemo(() => {
    const map = new Map(permissions.map((row) => [row.code, row.description]))
    return (code: Permission) => map.get(code) ?? code
  }, [permissions])

  const reassignOptions = useMemo(
    () => roles.filter((role) => role.code !== deleteRole?.code),
    [roles, deleteRole],
  )

  function openCreate() {
    setCode('')
    setName('')
    setDescription('')
    setSelectedPermissions(new Set())
    setCreateOpen(true)
  }

  function openEdit(role: RoleCatalogRow) {
    setEditRole(role)
    setName(role.name)
    setDescription(role.description)
    setSelectedPermissions(new Set(role.permissionCodes))
  }

  function openDelete(role: RoleCatalogRow) {
    const options = roles.filter((entry) => entry.code !== role.code)
    setDeleteRole(role)
    setReassignCode(
      options.find((entry) => entry.code === 'member')?.code ??
        options[0]?.code ??
        'member',
    )
  }

  function togglePermission(permission: Permission, checked: boolean) {
    setSelectedPermissions((current) => {
      const next = new Set(current)
      if (checked) {
        next.add(permission)
      } else {
        next.delete(permission)
      }
      return next
    })
  }

  async function onCreateSubmit() {
    setPending(true)
    const result = await createRole({
      data: {
        code,
        name,
        description,
        permissionCodes: [...selectedPermissions],
      },
    })
    setPending(false)
    if ('error' in result) {
      appToast.error(result.error)
      return
    }
    appToast.success('Role created.')
    setCreateOpen(false)
    onReload()
  }

  async function onEditSubmit() {
    if (!editRole) return
    setPending(true)
    const result = await updateRole({
      data: {
        code: editRole.code,
        name,
        description,
        permissionCodes: [...selectedPermissions],
      },
    })
    setPending(false)
    if ('error' in result) {
      appToast.error(result.error)
      return
    }
    appToast.success('Role updated.')
    setEditRole(null)
    onReload()
  }

  async function onDeleteSubmit() {
    if (!deleteRole) return
    setPending(true)
    const result = await removeRole({
      data: {
        code: deleteRole.code,
        reassignToRoleCode:
          deleteRole.memberCount > 0 ? reassignCode : undefined,
      },
    })
    setPending(false)
    if ('needsReassign' in result && result.needsReassign) {
      appToast.error(result.error)
      return
    }
    if ('error' in result) {
      appToast.error(result.error)
      return
    }
    appToast.success('Role deleted.')
    setDeleteRole(null)
    onReload()
  }

  return (
    <AdminSectionBlock
      title="Roles"
      description="Custom roles and permissions. Built-in roles stay read-only."
    >
      {canManageRoles ? (
        <div className="mb-4 flex justify-end">
          <Button type="button" size="sm" onClick={openCreate}>
            <Plus className="size-4" {...phosphorIcon} />
            New role
          </Button>
        </div>
      ) : null}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Role</TableHead>
            <TableHead>Permissions</TableHead>
            <TableHead>Members</TableHead>
            {canManageRoles ? (
              <TableHead className="w-28">Actions</TableHead>
            ) : null}
          </TableRow>
        </TableHeader>
        <TableBody>
          {roles.map((role) => (
            <TableRow key={role.code}>
              <TableCell>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <AdminStatusBadge
                      status={role.isSystem ? 'published' : 'draft'}
                      label={role.name}
                    />
                    <span className="font-mono text-xs text-muted-foreground">
                      {role.code}
                    </span>
                  </div>
                  {role.description ? (
                    <p className="text-sm text-muted-foreground">
                      {role.description}
                    </p>
                  ) : null}
                </div>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {role.permissionCodes.length > 0
                  ? role.permissionCodes
                      .map((permission) => permissionLabel(permission))
                      .join(', ')
                  : 'No permissions'}
              </TableCell>
              <TableCell>{role.memberCount}</TableCell>
              {canManageRoles ? (
                <TableCell>
                  {role.isSystem ? (
                    <span className="text-xs text-muted-foreground">
                      Built-in
                    </span>
                  ) : (
                    <div className="flex gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={`Edit ${role.name}`}
                        onClick={() => openEdit(role)}
                      >
                        <PencilSimple className="size-4" {...phosphorIcon} />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={`Delete ${role.name}`}
                        onClick={() => openDelete(role)}
                      >
                        <Trash className="size-4" {...phosphorIcon} />
                      </Button>
                    </div>
                  )}
                </TableCell>
              ) : null}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create role</DialogTitle>
            <DialogDescription>
              Pick a short code and choose what this role can do.
            </DialogDescription>
          </DialogHeader>
          <DialogBody>
            <RoleFormFields
              code={code}
              name={name}
              description={description}
              showCode
              onCodeChange={setCode}
              onNameChange={setName}
              onDescriptionChange={setDescription}
              permissions={permissions}
              selectedPermissions={selectedPermissions}
              onTogglePermission={togglePermission}
              permissionLabel={permissionLabel}
            />
          </DialogBody>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setCreateOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              loading={pending}
              disabled={pending || code.length < 1 || name.length < 1}
              onClick={() => void onCreateSubmit()}
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={editRole !== null}
        onOpenChange={(open) => {
          if (!open) setEditRole(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit {editRole?.name}</DialogTitle>
            <DialogDescription>
              Update the label and permissions for this custom role.
            </DialogDescription>
          </DialogHeader>
          <DialogBody>
            <RoleFormFields
              code={editRole?.code ?? ''}
              name={name}
              description={description}
              onNameChange={setName}
              onDescriptionChange={setDescription}
              permissions={permissions}
              selectedPermissions={selectedPermissions}
              onTogglePermission={togglePermission}
              permissionLabel={permissionLabel}
            />
          </DialogBody>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditRole(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              loading={pending}
              disabled={pending || name.length < 1}
              onClick={() => void onEditSubmit()}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={deleteRole !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteRole(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {deleteRole?.name}?</DialogTitle>
            <DialogDescription>
              {deleteRole && deleteRole.memberCount > 0
                ? `${deleteRole.memberCount} members use this role. Move them before deleting.`
                : 'This cannot be undone.'}
            </DialogDescription>
          </DialogHeader>
          {deleteRole && deleteRole.memberCount > 0 ? (
            <DialogBody className="grid gap-2 py-2">
              <Label htmlFor="reassign-role">Move members to</Label>
              <select
                id="reassign-role"
                value={reassignCode}
                onChange={(event) => setReassignCode(event.target.value)}
                className="admin-input-tall w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                {reassignOptions.map((role) => (
                  <option key={role.code} value={role.code}>
                    {role.name}
                  </option>
                ))}
              </select>
            </DialogBody>
          ) : null}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteRole(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              loading={pending}
              disabled={pending}
              onClick={() => void onDeleteSubmit()}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminSectionBlock>
  )
}

function RoleFormFields({
  code,
  name,
  description,
  showCode,
  onCodeChange,
  onNameChange,
  onDescriptionChange,
  permissions,
  selectedPermissions,
  onTogglePermission,
  permissionLabel,
}: {
  code: string
  name: string
  description: string
  showCode?: boolean
  onCodeChange?: (value: string) => void
  onNameChange: (value: string) => void
  onDescriptionChange: (value: string) => void
  permissions: PermissionRow[]
  selectedPermissions: Set<Permission>
  onTogglePermission: (permission: Permission, checked: boolean) => void
  permissionLabel: (code: Permission) => string
}) {
  return (
    <div className="grid gap-4 py-2">
      {showCode ? (
        <div>
          <Label htmlFor="role-code">Code</Label>
          <Input
            id="role-code"
            value={code}
            onChange={(event) => onCodeChange?.(event.target.value)}
            placeholder="editor"
            className="mt-1 font-mono text-sm"
            autoComplete="off"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Lowercase letters, numbers, and underscores. Cannot change later.
          </p>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Code: <span className="font-mono">{code}</span>
        </p>
      )}
      <div>
        <Label htmlFor="role-name">Name</Label>
        <Input
          id="role-name"
          value={name}
          onChange={(event) => onNameChange(event.target.value)}
          className="mt-1"
        />
      </div>
      <div>
        <Label htmlFor="role-description">Description</Label>
        <Input
          id="role-description"
          value={description}
          onChange={(event) => onDescriptionChange(event.target.value)}
          className="mt-1"
        />
      </div>
      <div>
        <p className="text-sm font-medium">Permissions</p>
        <ul className="mt-2 grid gap-2">
          {permissions.map((permission) => {
            const checked = selectedPermissions.has(permission.code)
            const id = `perm-${permission.code}`
            return (
              <li
                key={permission.code}
                className="flex items-start gap-2 text-sm"
              >
                <Checkbox
                  id={id}
                  checked={checked}
                  onCheckedChange={(value) =>
                    onTogglePermission(permission.code, value === true)
                  }
                />
                <label htmlFor={id} className="cursor-pointer leading-snug">
                  <span className="font-medium">
                    {permissionLabel(permission.code)}
                  </span>
                  <span className="block font-mono text-xs text-muted-foreground">
                    {permission.code}
                  </span>
                </label>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
