import '@tanstack/react-start/server-only'

import { UNAUTHORIZED_MESSAGE } from '#/auth/errors'
import { getAccess } from '#/auth/session.server'
import type { DomainContext } from '#/domain/types'
import type {
  meAvatarUploadBodySchema,
  meDisplayNameBodySchema,
} from '#/domain/api-schemas'
import type { z } from 'zod'
import {
  assertApiRateLimit,
  ApiRateLimitError,
} from '#/lib/api/rate-limit-api.server'
import { mapProfileByline } from '#/lib/account/profile-bylines'
import { validateAvatarBytes } from '#/lib/account/avatar-validation'
import {
  AVATARS_PUBLIC_PATH,
  parseAvatarUrlForSave,
  sanitizeAvatarUrl,
} from '#/lib/url-security'

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

function extensionForMime(mime: string) {
  if (mime === 'image/jpeg') {
    return 'jpg'
  }
  if (mime === 'image/png') {
    return 'png'
  }
  return 'webp'
}

export async function getMeDomain(ctx: DomainContext) {
  if (!ctx.user) {
    throw new Error(UNAUTHORIZED_MESSAGE)
  }
  const supabase = ctx.supabase
  const [profileResult, access, authUser] = await Promise.all([
    supabase
      .from('profiles')
      .select('user_id, display_name, avatar_url')
      .eq('user_id', ctx.user.id)
      .maybeSingle(),
    getAccess(ctx.user.id, supabase),
    supabase.auth.getUser(),
  ])

  if (profileResult.error) {
    console.error(profileResult.error)
    throw new Error('Unable to load profile')
  }

  const email = authUser.data.user?.email ?? ctx.user.email ?? null

  const byline = profileResult.data
    ? mapProfileByline(profileResult.data)
    : null

  return {
    userId: ctx.user.id,
    email,
    displayName: byline?.displayName ?? null,
    avatarUrl: byline?.avatarUrl ?? null,
    roles: access.roles,
    permissions: access.permissions,
  }
}

export async function updateMeDisplayNameDomain(
  ctx: DomainContext,
  input: z.infer<typeof meDisplayNameBodySchema>,
) {
  if (!ctx.user) {
    throw new Error(UNAUTHORIZED_MESSAGE)
  }
  const { error } = await ctx.supabase
    .from('profiles')
    .update({ display_name: input.displayName })
    .eq('user_id', ctx.user.id)
  if (error) {
    console.error(error)
    throw new Error('Unable to save name')
  }
  return { ok: true as const }
}

export async function uploadMeAvatarDomain(
  ctx: DomainContext,
  input: z.infer<typeof meAvatarUploadBodySchema>,
) {
  if (!ctx.user) {
    throw new Error(UNAUTHORIZED_MESSAGE)
  }
  if (ctx.apiTokenId) {
    try {
      assertApiRateLimit({
        tokenId: ctx.apiTokenId,
        action: 'avatar-upload',
        limit: 12,
        windowMs: 60 * 60 * 1000,
      })
    } catch (error) {
      if (error instanceof ApiRateLimitError) {
        throw new Error('Too many requests')
      }
      throw error
    }
  }
  const bytes = decodeBase64(input.imageBase64)
  const checked = validateAvatarBytes(bytes)
  if (!checked.ok) {
    throw new Error(checked.message)
  }
  if (checked.mime !== input.contentType) {
    throw new Error(checked.message)
  }
  const supabase = ctx.supabase
  const ext = extensionForMime(checked.mime)
  const path = `${ctx.user.id}/${Date.now()}.${ext}`
  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(path, bytes, {
      contentType: checked.mime,
      upsert: true,
    })
  if (uploadError) {
    console.error(uploadError)
    throw new Error('Unable to upload photo')
  }
  const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path)
  const avatarUrl = parseAvatarUrlForSave(urlData.publicUrl)
  if (!avatarUrl) {
    await supabase.storage.from('avatars').remove([path])
    throw new Error('Unable to save photo')
  }

  const { data: existing } = await supabase
    .from('profiles')
    .select('avatar_url')
    .eq('user_id', ctx.user.id)
    .maybeSingle()

  const { error: profileError } = await supabase
    .from('profiles')
    .update({ avatar_url: avatarUrl })
    .eq('user_id', ctx.user.id)
  if (profileError) {
    console.error(profileError)
    await supabase.storage.from('avatars').remove([path])
    throw new Error('Unable to save photo')
  }

  const oldUrl = existing?.avatar_url
  if (oldUrl) {
    const oldPath = storagePathFromPublicUrl(oldUrl)
    if (oldPath && oldPath !== path) {
      await supabase.storage.from('avatars').remove([oldPath])
    }
  }

  return { ok: true as const, avatarUrl }
}

export async function removeMeAvatarDomain(ctx: DomainContext) {
  if (!ctx.user) {
    throw new Error(UNAUTHORIZED_MESSAGE)
  }
  const supabase = ctx.supabase
  const { data: existing, error: readError } = await supabase
    .from('profiles')
    .select('avatar_url')
    .eq('user_id', ctx.user.id)
    .maybeSingle()
  if (readError) {
    console.error(readError)
    throw new Error('Unable to remove photo')
  }
  const oldUrl = existing?.avatar_url
  const { error } = await supabase
    .from('profiles')
    .update({ avatar_url: null })
    .eq('user_id', ctx.user.id)
  if (error) {
    console.error(error)
    throw new Error('Unable to remove photo')
  }
  if (oldUrl) {
    const oldPath = storagePathFromPublicUrl(oldUrl)
    if (oldPath) {
      await supabase.storage.from('avatars').remove([oldPath])
    }
  }
  return { ok: true as const }
}
