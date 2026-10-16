import {
  ArrowsLeftRight,
  FileText,
  Code,
  Gear,
  Image,
  Newspaper,
  Database,
  Scroll,
  SquaresFour,
  Tray,
  Terminal,
  Users,
  type Icon,
} from '@phosphor-icons/react'

import { PERMISSIONS, type Permission } from '#/auth'

export type AdminNavItem = {
  to: string
  label: string
  icon: Icon
  permission: Permission
  exact?: boolean
}

export type AdminNavGroup = {
  label: string
  items: AdminNavItem[]
}

export const ADMIN_NAV_GROUPS: AdminNavGroup[] = [
  {
    label: 'Site',
    items: [
      {
        to: '/admin',
        label: 'Dashboard',
        icon: SquaresFour,
        permission: PERMISSIONS.adminAccess,
        exact: true,
      },
      {
        to: '/admin/content',
        label: 'Content',
        icon: FileText,
        permission: PERMISSIONS.contentRead,
      },
      {
        to: '/admin/media',
        label: 'Media',
        icon: Image,
        permission: PERMISSIONS.mediaRead,
      },
      {
        to: '/admin/posts',
        label: 'Blog',
        icon: Newspaper,
        permission: PERMISSIONS.contentRead,
      },
      {
        to: '/admin/users',
        label: 'Users',
        icon: Users,
        permission: PERMISSIONS.rolesReadAll,
      },
      {
        to: '/admin/inbox',
        label: 'Inbox',
        icon: Tray,
        permission: PERMISSIONS.adminAccess,
      },
    ],
  },
  {
    label: 'System',
    items: [
      {
        to: '/admin/redirects',
        label: 'Redirects',
        icon: ArrowsLeftRight,
        permission: PERMISSIONS.adminAccess,
      },
      {
        to: '/admin/audit',
        label: 'Audit log',
        icon: Scroll,
        permission: PERMISSIONS.adminAccess,
      },
      {
        to: '/admin/sql-templates',
        label: 'SQL templates',
        icon: Terminal,
        permission: PERMISSIONS.adminAccess,
      },
      {
        to: '/admin/database',
        label: 'Database',
        icon: Database,
        permission: PERMISSIONS.adminAccess,
      },
      {
        to: '/admin/settings',
        label: 'Settings',
        icon: Gear,
        permission: PERMISSIONS.settingsRead,
      },
      {
        to: '/admin/api',
        label: 'API and MCP',
        icon: Code,
        permission: PERMISSIONS.adminAccess,
      },
    ],
  },
]

export const ADMIN_NAV = ADMIN_NAV_GROUPS.flatMap((group) => group.items)
