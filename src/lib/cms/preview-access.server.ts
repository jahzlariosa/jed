import '@tanstack/react-start/server-only'

import { isAdmin } from '#/auth/admin'
import { getAccess, getCurrentUser } from '#/auth/session.server'

export async function staffCanPreviewDrafts(): Promise<boolean> {
  const user = await getCurrentUser()
  if (!user) {
    return false
  }
  const access = await getAccess(user.id)
  return isAdmin(access)
}
