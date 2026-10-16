import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

import { PERMISSIONS } from '#/auth/permissions'
import {
  clearRequestAuth,
  getAccess,
  getRequestClient,
  markPrivateNoStore,
  requireUser,
} from '#/auth/session.server'
import { parsePassword } from '#/auth/validators'
import { assertRateLimit, RATE_LIMIT_MESSAGE } from '#/lib/rate-limit.server'
import { createClient } from '#/lib/supabase/server'

import {
  AVATARS_PUBLIC_PATH,
  parseAvatarUrlForSave,
  sanitizeAvatarUrl,
} from '#/lib/url-security'

import { mapProfileByline } from './profile-bylines'
import { validateAvatarBytes } from './avatar-validation'

const displayNameSchema = z
  .string()
  .trim()
  .min(1, 'Enter a name')
  .max(120, 'Name is too long')

const avatarUploadSchema = z.object({
  /** Base64 payload without data URL prefix */
  imageBase64: z.string().max(3_000_000),
  contentType: z.literal('image/webp'),
})

function decodeBase64(payload: string) {
  const buffer = Buffer.from(payload, 'base64')
  return new Uint8Array(buffer)
}

function storagePathFromPublicUrl(avatarUrl: string): string | null {
  const safe = sanitizeAvatarUrl(avatarUrl)
  if (!safe) {
    return null
  }
  try {
    const url = new URL(safe)
    if (!url.pathname.startsWith(AVATARS_PUBLIC_PATH)) {
      return null
    }
    return url.pathname.slice(AVATARS_PUBLIC_PATH.length)
  } catch {
    return null
  }
}

export const getAccountProfileFn = createServerFn({ method: 'GET' }).handler(
  async () => {
    markPrivateNoStore()
    const user = await requireUser()
    const supabase = getRequestClient()
    const [profileResult, access] = await Promise.all([
      supabase
        .from('profiles')
        .select('user_id, display_name, avatar_url, created_at')
        .eq('user_id', user.id)
        .maybeSingle(),
      getAccess(user.id),
    ])

    if (profileResult.error) {
      console.error(profileResult.error)
      throw new Error('Unable to load profile')
    }

    const row = profileResult.data
    const byline = row
      ? mapProfileByline({
          user_id: row.user_id,
          display_name: row.display_name,
          avatar_url: row.avatar_url,
        })
      : null
    return {
      userId: user.id,
      email: user.email,
      displayName: byline?.displayName ?? null,
      avatarUrl: byline?.avatarUrl ?? null,
      createdAt: row?.created_at ?? null,
      roles: access.roles,
      permissions: access.permissions,
    }
  },
)

export const getAccountMenuFn = createServerFn({ method: 'GET' }).handler(
  async () => {
    markPrivateNoStore()
    const user = await requireUser()
    const supabase = getRequestClient()
    const [profileResult, access] = await Promise.all([
      supabase
        .from('profiles')
        .select('display_name, avatar_url')
        .eq('user_id', user.id)
        .maybeSingle(),
      getAccess(user.id),
    ])
    if (profileResult.error) {
      console.error(profileResult.error)
      return null
    }
    const byline = profileResult.data
      ? mapProfileByline({
          user_id: user.id,
          display_name: profileResult.data.display_name,
          avatar_url: profileResult.data.avatar_url,
        })
      : null
    return {
      email: user.email,
      displayName: byline?.displayName ?? null,
      avatarUrl: byline?.avatarUrl ?? null,
      adminAccess: access.permissions.includes(PERMISSIONS.adminAccess),
    }
  },
)

export const updateAccountDisplayNameFn = createServerFn({ method: 'POST' })
  .validator((input: unknown) => {
    if (typeof input !== 'object' || input === null) {
      throw new Error('Unable to save name')
    }
    const data = input as Record<string, unknown>
    return { displayName: displayNameSchema.parse(data.displayName) }
  })
  .handler(async ({ data }) => {
    markPrivateNoStore()
    const user = await requireUser()
    const supabase = getRequestClient()
    const { error } = await supabase
      .from('profiles')
      .update({ display_name: data.displayName })
      .eq('user_id', user.id)
    if (error) {
      console.error(error)
      return { error: 'Unable to save name' }
    }
    return { ok: true as const }
  })

export const uploadAccountAvatarFn = createServerFn({ method: 'POST' })
  .validator((input: unknown) => avatarUploadSchema.parse(input))
  .handler(async ({ data }) => {
    markPrivateNoStore()
    try {
      assertRateLimit('account:avatar-upload', 12, 60 * 60 * 1000)
    } catch {
      return { error: RATE_LIMIT_MESSAGE }
    }
    const user = await requireUser()
    const bytes = decodeBase64(data.imageBase64)
    const checked = validateAvatarBytes(bytes)
    if (!checked.ok) {
      return { error: checked.message }
    }
    const supabase = getRequestClient()
    const path = `${user.id}/${Date.now()}.webp`
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, bytes, {
        contentType: 'image/webp',
        upsert: true,
      })
    if (uploadError) {
      console.error(uploadError)
      return { error: 'Unable to upload photo' }
    }
    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(path)
    const avatarUrl = parseAvatarUrlForSave(urlData.publicUrl)
    if (!avatarUrl) {
      await supabase.storage.from('avatars').remove([path])
      return { error: 'Unable to save photo' }
    }

    const { data: existing } = await supabase
      .from('profiles')
      .select('avatar_url')
      .eq('user_id', user.id)
      .maybeSingle()

    const { error: profileError } = await supabase
      .from('profiles')
      .update({ avatar_url: avatarUrl })
      .eq('user_id', user.id)
    if (profileError) {
      console.error(profileError)
      await supabase.storage.from('avatars').remove([path])
      return { error: 'Unable to save photo' }
    }

    const oldUrl = existing?.avatar_url
    if (oldUrl) {
      const oldPath = storagePathFromPublicUrl(oldUrl)
      if (oldPath && oldPath !== path) {
        await supabase.storage.from('avatars').remove([oldPath])
      }
    }

    return { ok: true as const, avatarUrl }
  })

export const removeAccountAvatarFn = createServerFn({ method: 'POST' }).handler(
  async () => {
    markPrivateNoStore()
    const user = await requireUser()
    const supabase = getRequestClient()
    const { data: existing, error: readError } = await supabase
      .from('profiles')
      .select('avatar_url')
      .eq('user_id', user.id)
      .maybeSingle()
    if (readError) {
      console.error(readError)
      return { error: 'Unable to remove photo' }
    }
    const oldUrl = existing?.avatar_url
    const { error } = await supabase
      .from('profiles')
      .update({ avatar_url: null })
      .eq('user_id', user.id)
    if (error) {
      console.error(error)
      return { error: 'Unable to remove photo' }
    }
    if (oldUrl) {
      const oldPath = storagePathFromPublicUrl(oldUrl)
      if (oldPath) {
        await supabase.storage.from('avatars').remove([oldPath])
      }
    }
    return { ok: true as const }
  },
)

export const updateAccountPasswordFn = createServerFn({ method: 'POST' })
  .validator((input: unknown) => {
    if (typeof input !== 'object' || input === null) {
      throw new Error('Unable to update password')
    }
    const data = input as Record<string, unknown>
    const current =
      typeof data.currentPassword === 'string' ? data.currentPassword : ''
    if (!current) {
      throw new Error('Enter your current password')
    }
    return {
      password: parsePassword(data.password),
      currentPassword: current,
    }
  })
  .handler(async ({ data }) => {
    markPrivateNoStore()
    try {
      assertRateLimit('auth:update-password', 10, 60 * 60 * 1000)
    } catch {
      return { error: RATE_LIMIT_MESSAGE }
    }
    const user = await requireUser()
    const supabase = createClient()
    const email = user.email
    if (!email) {
      return { error: 'Unable to update password' }
    }
    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email,
      password: data.currentPassword,
    })
    if (verifyError) {
      return { error: 'Current password is incorrect' }
    }
    const { error } = await supabase.auth.updateUser({
      password: data.password,
    })
    if (error) {
      console.error(error)
      return { error: 'Unable to update password' }
    }
    clearRequestAuth()
    return { ok: true as const }
  })
