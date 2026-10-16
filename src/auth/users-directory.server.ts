import '@tanstack/react-start/server-only'

import {
  usersDirectoryPageCount,
  type UsersDirectoryQuery,
} from '#/auth/users-directory-query'
import { escapeLike } from '#/auth/validators'
import { mapProfileByline } from '#/lib/account/profile-bylines'
import { createServiceRoleClient } from '#/lib/supabase/service-role.server'

function resolveAccountStatus(input: {
  bannedUntil: string | null
  emailConfirmedAt: string | null
}): 'active' | 'banned' | 'unconfirmed' {
  const banned =
    input.bannedUntil !== null &&
    new Date(input.bannedUntil).getTime() > Date.now()
  if (banned) {
    return 'banned'
  }
  if (!input.emailConfirmedAt) {
    return 'unconfirmed'
  }
  return 'active'
}

async function countAdmins(
  service: ReturnType<typeof createServiceRoleClient>,
) {
  const { count, error } = await service
    .from('user_roles')
    .select('user_id', { count: 'exact', head: true })
    .eq('role_code', 'admin')
  if (error) {
    console.error(error)
    throw new Error('Unable to verify admin count')
  }
  return count ?? 0
}

export async function fetchUsersDirectory(query: UsersDirectoryQuery) {
  const service = createServiceRoleClient()
  const offset = (query.page - 1) * query.pageSize
  const escapedQ = query.q ? escapeLike(query.q) : null

  const { data: rows, error } = await service.rpc(
    'admin_list_directory_users',
    {
      p_q: escapedQ,
      p_role: query.role ?? null,
      p_status: query.status ?? null,
      p_mfa: query.mfa ?? null,
      p_created_from: query.createdFrom
        ? `${query.createdFrom}T00:00:00.000Z`
        : null,
      p_created_to: query.createdTo ? `${query.createdTo}T00:00:00.000Z` : null,
      p_limit: query.pageSize,
      p_offset: offset,
    },
  )

  if (error) {
    console.error(error)
    throw new Error('Unable to load users')
  }

  const directoryRows = rows ?? []
  const total =
    directoryRows.length > 0 ? Number(directoryRows[0]?.total_count ?? 0) : 0

  const ids = directoryRows.map((row) => row.user_id)
  const [rolesResult, adminCount] = await Promise.all([
    ids.length > 0
      ? service
          .from('user_roles')
          .select('user_id, role_code')
          .in('user_id', ids)
      : Promise.resolve({ data: [], error: null }),
    countAdmins(service),
  ])

  if (rolesResult.error) {
    console.error(rolesResult.error)
    throw new Error('Unable to load roles')
  }

  const rolesByUser = new Map<string, string[]>()
  for (const row of rolesResult.data ?? []) {
    const list = rolesByUser.get(row.user_id) ?? []
    list.push(row.role_code)
    rolesByUser.set(row.user_id, list)
  }

  return {
    adminCount,
    page: query.page,
    pageSize: query.pageSize,
    pageCount: usersDirectoryPageCount(total, query.pageSize),
    total,
    users: directoryRows.map((row) => {
      const byline = mapProfileByline({
        user_id: row.user_id,
        display_name: row.display_name,
        avatar_url: row.avatar_url,
      })
      return {
        userId: row.user_id,
        email: row.email,
        displayName: byline.displayName,
        avatarUrl: byline.avatarUrl,
        createdAt: row.profile_created_at,
        roleCodes: rolesByUser.get(row.user_id) ?? ['member'],
        accountStatus: resolveAccountStatus({
          bannedUntil: row.banned_until,
          emailConfirmedAt: row.email_confirmed_at,
        }),
        mfaEnabled: Boolean(row.has_mfa),
      }
    }),
  }
}
