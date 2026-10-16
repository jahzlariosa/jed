import { sanitizeAvatarUrl } from '#/lib/url-security'

export type ProfileByline = {
  userId: string
  displayName: string | null
  avatarUrl: string | null
}

export function mapProfileByline(row: {
  user_id: string
  display_name: string | null
  avatar_url: string | null
}): ProfileByline {
  return {
    userId: row.user_id,
    displayName: row.display_name,
    avatarUrl: sanitizeAvatarUrl(row.avatar_url),
  }
}
