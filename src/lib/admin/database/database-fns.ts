import { createServerFn } from '@tanstack/react-start'

import { markPrivateNoStore } from '#/auth/session.server'

export const getAdminDatabaseFn = createServerFn({ method: 'GET' }).handler(
  async () => {
    markPrivateNoStore()
    const { loadAdminDatabaseWithAuth } = await import(
      '#/lib/admin/database/database-fns.server'
    )
    return loadAdminDatabaseWithAuth()
  },
)
