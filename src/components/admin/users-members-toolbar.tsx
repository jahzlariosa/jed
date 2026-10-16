import { UserPlus } from '@phosphor-icons/react'

import type {
  UsersAccountStatus,
  UsersMfaFilter,
} from '#/auth/users-directory-query'
import { phosphorIcon } from '#/lib/icon'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function UsersMembersToolbar({
  q,
  role,
  status,
  mfa,
  createdFrom,
  createdTo,
  roleOptions,
  onSearchChange,
  onRoleChange,
  onStatusChange,
  onMfaChange,
  onCreatedFromChange,
  onCreatedToChange,
  canAddUser,
  onAddUser,
}: {
  q: string
  role?: string
  status?: UsersAccountStatus
  mfa?: UsersMfaFilter
  createdFrom?: string
  createdTo?: string
  roleOptions: Array<{ code: string; label: string }>
  onSearchChange: (q: string) => void
  onRoleChange: (role: string | undefined) => void
  onStatusChange: (status: UsersAccountStatus | undefined) => void
  onMfaChange: (mfa: UsersMfaFilter | undefined) => void
  onCreatedFromChange: (value: string | undefined) => void
  onCreatedToChange: (value: string | undefined) => void
  canAddUser: boolean
  onAddUser: () => void
}) {
  return (
    <div className="admin-users-toolbar">
      <div className="admin-users-toolbar-filters">
        <Input
          id="users-search"
          type="search"
          value={q}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search by name or email"
          className="admin-users-toolbar-search"
          autoComplete="off"
          aria-label="Search members"
        />
        <div className="admin-users-toolbar-select-wrap">
          <Label htmlFor="users-filter-role" className="sr-only">
            Role
          </Label>
          <select
            id="users-filter-role"
            className="admin-users-toolbar-select"
            value={role ?? ''}
            onChange={(event) => onRoleChange(event.target.value || undefined)}
          >
            <option value="">All roles</option>
            {roleOptions.map((option) => (
              <option key={option.code} value={option.code}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="admin-users-toolbar-select-wrap">
          <Label htmlFor="users-filter-status" className="sr-only">
            Status
          </Label>
          <select
            id="users-filter-status"
            className="admin-users-toolbar-select"
            value={status ?? ''}
            onChange={(event) => {
              const value = event.target.value
              onStatusChange(
                value === '' ? undefined : (value as UsersAccountStatus),
              )
            }}
          >
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="unconfirmed">Unconfirmed</option>
            <option value="banned">Banned</option>
          </select>
        </div>
        <div className="admin-users-toolbar-select-wrap">
          <Label htmlFor="users-filter-mfa" className="sr-only">
            MFA
          </Label>
          <select
            id="users-filter-mfa"
            className="admin-users-toolbar-select"
            value={mfa ?? ''}
            onChange={(event) => {
              const value = event.target.value
              onMfaChange(value === '' ? undefined : (value as UsersMfaFilter))
            }}
          >
            <option value="">All MFA</option>
            <option value="enabled">MFA enabled</option>
            <option value="disabled">MFA off</option>
          </select>
        </div>
        <div className="admin-users-toolbar-date">
          <Label htmlFor="users-created-from" className="sr-only">
            Created from
          </Label>
          <Input
            id="users-created-from"
            type="date"
            value={createdFrom ?? ''}
            onChange={(event) =>
              onCreatedFromChange(event.target.value || undefined)
            }
            className="admin-users-toolbar-date-input"
            aria-label="Created from"
          />
        </div>
        <div className="admin-users-toolbar-date">
          <Label htmlFor="users-created-to" className="sr-only">
            Created to
          </Label>
          <Input
            id="users-created-to"
            type="date"
            value={createdTo ?? ''}
            onChange={(event) =>
              onCreatedToChange(event.target.value || undefined)
            }
            className="admin-users-toolbar-date-input"
            aria-label="Created to"
          />
        </div>
      </div>
      {canAddUser ? (
        <Button
          type="button"
          size="sm"
          className="admin-users-toolbar-add gap-1.5"
          onClick={onAddUser}
        >
          <UserPlus {...phosphorIcon} className="size-4" aria-hidden />
          Add user
        </Button>
      ) : null}
    </div>
  )
}
