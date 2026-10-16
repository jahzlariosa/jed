import { beforeEach, describe, expect, it, vi } from 'vitest'

const requireAdminRead = vi.fn()
const rpc = vi.fn()

vi.mock('#/auth/admin-access.server', () => ({
  requireAdminRead: (...args: unknown[]) => requireAdminRead(...args),
}))

vi.mock('#/auth/session.server', () => ({
  markPrivateNoStore: vi.fn(),
}))

vi.mock('#/lib/supabase/service-role.server', () => ({
  createServiceRoleClient: () => ({ rpc }),
}))

import {
  clearAdminDatabaseCache,
  loadAdminDatabaseWithAuth,
} from '#/lib/admin/database/database-fns.server'

describe('loadAdminDatabaseWithAuth permission gating', () => {
  beforeEach(() => {
    requireAdminRead.mockReset()
    rpc.mockReset()
    clearAdminDatabaseCache()
  })

  it('calls requireAdminRead before loading insights', async () => {
    requireAdminRead.mockResolvedValue({
      user: { id: 'u1', email: 'a@example.com' },
      access: { roles: ['admin'], permissions: ['admin.access'] },
      supabase: {},
    })
    rpc.mockImplementation((name: string) => {
      const payloads: Record<string, unknown> = {
        admin_database_overview: {
          databaseBytes: 1,
          storageBuckets: [],
        },
        admin_database_tables: [],
        admin_database_diagram: { tables: [], relationships: [] },
        admin_database_activity: {
          connectionsByState: [],
          slowQueriesAvailable: false,
          slowQueries: [],
        },
      }
      return Promise.resolve({ data: payloads[name], error: null })
    })

    await loadAdminDatabaseWithAuth()
    expect(requireAdminRead).toHaveBeenCalledTimes(1)
    expect(rpc).toHaveBeenCalled()
  })

  it('does not call service RPC when admin read fails', async () => {
    requireAdminRead.mockRejectedValue(new Error('Forbidden'))
    await expect(loadAdminDatabaseWithAuth()).rejects.toThrow('Forbidden')
    expect(rpc).not.toHaveBeenCalled()
  })

  it('loads overview when activity RPC fails', async () => {
    requireAdminRead.mockResolvedValue({
      user: { id: 'u1', email: 'a@example.com' },
      access: { roles: ['admin'], permissions: ['admin.access'] },
      supabase: {},
    })
    rpc.mockImplementation((name: string) => {
      if (name === 'admin_database_activity') {
        return Promise.resolve({
          data: null,
          error: {
            code: '42883',
            message:
              'function pg_catalog.coalesce(text, unknown) does not exist',
          },
        })
      }
      const payloads: Record<string, unknown> = {
        admin_database_overview: {
          databaseBytes: 100,
          storageBuckets: [],
        },
        admin_database_tables: [],
        admin_database_diagram: { tables: [], relationships: [] },
      }
      return Promise.resolve({ data: payloads[name], error: null })
    })

    const snapshot = await loadAdminDatabaseWithAuth()
    expect(snapshot.overview.databaseBytes).toBe(100)
    expect(snapshot.activityError).toBe(
      'Activity stats could not be loaded. Try again later.',
    )
    expect(rpc).toHaveBeenCalledWith('admin_database_overview')
    expect(rpc).toHaveBeenCalledWith('admin_database_activity')
  })

  it('surfaces permission errors without migration copy', async () => {
    requireAdminRead.mockResolvedValue({
      user: { id: 'u1', email: 'a@example.com' },
      access: { roles: ['admin'], permissions: ['admin.access'] },
      supabase: {},
    })
    rpc.mockImplementation((name: string) => {
      if (name === 'admin_database_overview') {
        return Promise.resolve({
          data: null,
          error: { code: '42501', message: 'permission denied' },
        })
      }
      return Promise.resolve({ data: null, error: null })
    })

    await expect(loadAdminDatabaseWithAuth()).rejects.toThrow(
      'You do not have permission to load database insights.',
    )
  })
})
