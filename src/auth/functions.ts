import { redirect } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { setAuthSessionPersistence } from '#/lib/supabase/auth-cookie.server'
import { createClient } from '#/lib/supabase/server'
import { createServiceRoleClient } from '#/lib/supabase/service-role.server'

import { loadAuthRedirectSettings } from '#/lib/cms/auth-redirect-settings.server'
import { assertRateLimit, RATE_LIMIT_MESSAGE } from '#/lib/rate-limit.server'

import { requireCmsAccess, requireCmsWrite } from '#/auth/admin-access.server'

import { resolveSignedInRedirect } from './post-auth-redirect.server'
import { passwordResetLandingPath, resolvePostSignInHref } from './redirect'
import { PERMISSIONS } from './permissions'
import {
  clearRequestAuth,
  getAccess,
  getAccessWithClient,
  getAppOrigin,
  getCurrentUser,
  getRequestClient,
  markPrivateNoStore,
  requireUser,
} from './session.server'
import {
  DIRECTORY_PAGE_SIZE,
  escapeLike,
  parseBoolean,
  parseDirectoryQuery,
  parseEmail,
  parseOptionalRedirect,
  parsePassword,
  parseRememberMe,
  parseRoleCode,
  parseUserId,
} from './validators'

export const getCurrentUserFn = createServerFn({ method: 'GET' }).handler(
  async () => {
    try {
      return await getCurrentUser()
    } catch (error) {
      console.error(error)
      return null
    }
  },
)

export const getSignedInRedirectHrefFn = createServerFn({ method: 'GET' })
  .validator((input: unknown) => {
    if (typeof input !== 'object' || input === null) {
      return { redirectTo: undefined }
    }
    const data = input as Record<string, unknown>
    const redirectTo =
      typeof data.redirectTo === 'string' ? data.redirectTo : undefined
    return { redirectTo }
  })
  .handler(async ({ data }) => {
    markPrivateNoStore()
    return resolveSignedInRedirect(data.redirectTo)
  })

export const APP_SHELL_CACHE_KEY = 'shell:full'
export const APP_SHELL_TTL_MS = 90_000

/**
 * User + access in one call for authenticated `beforeLoad`. Client TTL via `cachedFetch`.
 * UX gating only: every private server fn re-checks.
 */
export const getAppShellFn = createServerFn({ method: 'GET' }).handler(
  async () => {
    try {
      const { loadAppShellDto } = await import('#/auth/app-shell.server')
      return await loadAppShellDto()
    } catch (error) {
      console.error(error)
      return null
    }
  },
)

/** @deprecated Use `getAppShellFn` */
export const getSessionFn = getAppShellFn

export const getProfileFn = createServerFn({ method: 'GET' }).handler(
  async () => {
    const user = await requireUser()
    const supabase = getRequestClient()
    const [profileResult, access] = await Promise.all([
      supabase
        .from('profiles')
        .select('user_id, created_at')
        .eq('user_id', user.id)
        .maybeSingle(),
      getAccess(user.id),
    ])

    if (profileResult.error) {
      console.error(profileResult.error)
      throw new Error('Unable to load profile')
    }

    const data = profileResult.data
    return {
      userId: user.id,
      email: user.email,
      createdAt: data?.created_at ?? null,
      roles: access.roles,
      permissions: access.permissions,
    }
  },
)

export const getAdminOverviewFn = createServerFn({ method: 'GET' }).handler(
  async () => {
    markPrivateNoStore()
    const { user } = await requireCmsAccess(
      PERMISSIONS.adminAccess,
      PERMISSIONS.profilesReadAll,
      PERMISSIONS.rolesReadAll,
    )
    const supabase = getRequestClient()

    // Admin total comes from the directory loader (`adminCount`), so it is not counted twice.
    const [peopleCount, memberCount, roleCount, permissionCount] =
      await Promise.all([
        supabase
          .from('profiles')
          .select('user_id', { count: 'exact', head: true }),
        supabase
          .from('user_roles')
          .select('user_id', { count: 'exact', head: true })
          .eq('role_code', 'member'),
        supabase.from('roles').select('code', { count: 'exact', head: true }),
        supabase
          .from('permissions')
          .select('code', { count: 'exact', head: true }),
      ])

    const countError =
      peopleCount.error ??
      memberCount.error ??
      roleCount.error ??
      permissionCount.error

    if (countError) {
      console.error(countError)
      throw new Error('Unable to load admin overview')
    }

    return {
      viewerId: user.id,
      counts: {
        people: peopleCount.count ?? 0,
        members: memberCount.count ?? 0,
        roles: roleCount.count ?? 0,
        permissions: permissionCount.count ?? 0,
      },
    }
  },
)

export const listRoleDirectoryFn = createServerFn({ method: 'GET' })
  .validator((input: unknown) => parseDirectoryQuery(input))
  .handler(async ({ data: query }) => {
    markPrivateNoStore()
    const { user, access } = await requireCmsAccess(
      PERMISSIONS.adminAccess,
      PERMISSIONS.profilesReadAll,
      PERMISSIONS.rolesReadAll,
    )
    const supabase = getRequestClient()
    const service = createServiceRoleClient()
    const from = (query.page - 1) * DIRECTORY_PAGE_SIZE
    const to = from + DIRECTORY_PAGE_SIZE - 1

    // Search and role filter run in Postgres. `!inner` keeps only profiles that hold the role.
    const profilesQuery = query.role
      ? service
          .from('profiles')
          .select('user_id, email, created_at, user_roles!inner(role_code)', {
            count: 'exact',
          })
          .eq('user_roles.role_code', query.role)
      : service
          .from('profiles')
          .select('user_id, email, created_at', { count: 'exact' })
    const filteredProfiles = query.q
      ? profilesQuery.ilike('email', `%${escapeLike(query.q)}%`)
      : profilesQuery

    const [rolesResult, permissionsResult, profilesResult, adminCountResult] =
      await Promise.all([
        supabase
          .from('roles')
          .select('code, name, description, is_system')
          .order('name')
          .limit(50),
        supabase
          .from('permissions')
          .select('code, description')
          .order('code')
          .limit(50),
        filteredProfiles
          .order('created_at', { ascending: false })
          .order('user_id')
          .range(from, to),
        supabase
          .from('user_roles')
          .select('user_id', { count: 'exact', head: true })
          .eq('role_code', 'admin'),
      ])

    if (rolesResult.error) {
      console.error(rolesResult.error)
      throw new Error('Unable to load roles')
    }

    if (permissionsResult.error) {
      console.error(permissionsResult.error)
      throw new Error('Unable to load permissions')
    }

    if (profilesResult.error) {
      console.error(profilesResult.error)
      throw new Error('Unable to load users')
    }

    if (adminCountResult.error) {
      console.error(adminCountResult.error)
      throw new Error('Unable to load users')
    }

    const profiles = profilesResult.data ?? []
    const profileIds = profiles.map((profile) => profile.user_id)
    const userRolesResult =
      profileIds.length > 0
        ? await supabase
            .from('user_roles')
            .select('user_id, role_code')
            .in('user_id', profileIds)
        : { data: [], error: null }

    if (userRolesResult.error) {
      console.error(userRolesResult.error)
      throw new Error('Unable to load assignments')
    }

    const rolesByUser = new Map<string, string[]>()
    for (const row of userRolesResult.data ?? []) {
      const current = rolesByUser.get(row.user_id) ?? []
      current.push(row.role_code)
      rolesByUser.set(row.user_id, current)
    }

    return {
      canManage: access.permissions.includes(PERMISSIONS.rolesManage),
      viewerId: user.id,
      adminCount: adminCountResult.count ?? 0,
      page: query.page,
      pageSize: DIRECTORY_PAGE_SIZE,
      total: profilesResult.count ?? 0,
      roles: rolesResult.data ?? [],
      permissions: permissionsResult.data ?? [],
      users: profiles.map((profile) => ({
        userId: profile.user_id,
        email: profile.email,
        createdAt: profile.created_at,
        roleCodes: rolesByUser.get(profile.user_id) ?? [],
      })),
    }
  })

export const setUserRoleFn = createServerFn({ method: 'POST' })
  .validator((input: unknown) => {
    if (typeof input !== 'object' || input === null) {
      throw new Error('Unable to update role')
    }

    const data = input as Record<string, unknown>
    return {
      userId: parseUserId(data.userId),
      roleCode: parseRoleCode(data.roleCode),
      assigned: parseBoolean(data.assigned),
    }
  })
  .handler(async ({ data }) => {
    const { supabase } = await requireCmsWrite(PERMISSIONS.rolesManage)

    if (data.assigned) {
      const { error } = await supabase.from('user_roles').insert({
        user_id: data.userId,
        role_code: data.roleCode,
      })

      if (error) {
        if (error.code === '23505') {
          return { ok: true as const }
        }
        console.error(error)
        return { error: 'Unable to assign role' }
      }

      return { ok: true as const }
    }

    const { error } = await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', data.userId)
      .eq('role_code', data.roleCode)

    if (error) {
      console.error(error)
      if (error.message.includes('Cannot remove the last admin')) {
        return { error: 'Keep at least one admin' }
      }
      return { error: 'Unable to revoke role' }
    }

    return { ok: true as const }
  })

export const signInWithGoogleFn = createServerFn({ method: 'POST' })
  .validator((input: unknown) => {
    if (typeof input !== 'object' || input === null) {
      return { redirectTo: undefined }
    }
    const data = input as Record<string, unknown>
    const redirectTo =
      typeof data.redirectTo === 'string' ? data.redirectTo : undefined
    return { redirectTo: parseOptionalRedirect(redirectTo) }
  })
  .handler(async ({ data }) => {
    markPrivateNoStore()
    const supabase = createClient()
    const origin = getAppOrigin()
    const { data: oauth, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(
          data.redirectTo ?? '/',
        )}`,
      },
    })
    if (error || !oauth.url) {
      console.error(error)
      return { error: 'Unable to start Google sign in' }
    }
    throw redirect({ href: oauth.url })
  })

export const resendAuthEmailFn = createServerFn({ method: 'POST' })
  .validator((input: unknown) => {
    if (typeof input !== 'object' || input === null) {
      throw new Error('Unable to resend email')
    }
    const email = parseEmail((input as Record<string, unknown>).email)
    const flow =
      (input as Record<string, unknown>).flow === 'reset' ? 'reset' : 'signup'
    return { email, flow }
  })
  .handler(async ({ data }) => {
    markPrivateNoStore()
    try {
      assertRateLimit('auth:resend-email', 5, 60 * 60 * 1000)
    } catch {
      return { error: RATE_LIMIT_MESSAGE }
    }
    const supabase = createClient()
    const origin = getAppOrigin()
    if (data.flow === 'reset') {
      await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${origin}/auth/callback?next=${encodeURIComponent('/reset-password')}`,
      })
    } else {
      await supabase.auth.resend({ type: 'signup', email: data.email })
    }
    return { ok: true as const }
  })

export const signInWithPasswordFn = createServerFn({ method: 'POST' })
  .validator((input: unknown) => {
    if (typeof input !== 'object' || input === null) {
      throw new Error('Unable to sign in')
    }

    const data = input as Record<string, unknown>
    return {
      email: parseEmail(data.email),
      password: parsePassword(data.password),
      redirectTo: parseOptionalRedirect(data.redirectTo),
      remember: parseRememberMe(data.remember),
    }
  })
  .handler(async ({ data }) => {
    markPrivateNoStore()
    try {
      assertRateLimit('auth:sign-in', 20, 15 * 60 * 1000)
    } catch {
      return { error: RATE_LIMIT_MESSAGE }
    }
    setAuthSessionPersistence(data.remember)
    const supabase = createClient()
    const { data: signInData, error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })

    if (error) {
      console.error(error)
      return { error: 'Email or password is incorrect' }
    }

    const authUser = signInData.user
    if (!authUser) {
      console.error('signInWithPassword succeeded without a user')
      return { error: 'Email or password is incorrect' }
    }

    if (!signInData.session) {
      const { data: factors, error: factorsError } =
        await supabase.auth.mfa.listFactors()
      if (factorsError) {
        console.error(factorsError)
        return { error: 'Email or password is incorrect' }
      }
      const verified = (factors.totp ?? []).find((f) => f.status === 'verified')
      if (verified) {
        return { mfaRequired: true as const, factorId: verified.id }
      }
      return { error: 'Email or password is incorrect' }
    }

    const user = {
      id: authUser.id,
      email: authUser.email ?? null,
    }
    const access = await getAccessWithClient(user.id, supabase)
    const settings = await loadAuthRedirectSettings()
    const redirectTo = resolvePostSignInHref(access, data.redirectTo, settings)
    clearRequestAuth()
    // Login replaces the document with this path. Throwing redirect() made
    // useServerFn navigate again, and a miss on admin.access then sent the
    // browser to /account.
    return { redirectTo }
  })

export const signUpWithPasswordFn = createServerFn({ method: 'POST' })
  .validator((input: unknown) => {
    if (typeof input !== 'object' || input === null) {
      throw new Error('Unable to create account')
    }

    const data = input as Record<string, unknown>
    return {
      email: parseEmail(data.email),
      password: parsePassword(data.password),
      displayName:
        typeof data.displayName === 'string'
          ? data.displayName.trim().slice(0, 120)
          : '',
    }
  })
  .handler(async ({ data }) => {
    markPrivateNoStore()
    try {
      assertRateLimit('auth:sign-up', 10, 60 * 60 * 1000)
    } catch {
      return { error: RATE_LIMIT_MESSAGE }
    }
    const supabase = createClient()
    const origin = getAppOrigin()
    const settings = await loadAuthRedirectSettings()
    const { data: result, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(settings.signUp)}`,
        data: data.displayName ? { display_name: data.displayName } : undefined,
      },
    })

    if (error) {
      console.error(error)
      return { error: 'Unable to create account' }
    }

    if (data.displayName && result.user?.id) {
      try {
        const { createServiceRoleClient } = await import(
          '#/lib/supabase/service-role.server'
        )
        const service = createServiceRoleClient()
        await service
          .from('profiles')
          .update({ display_name: data.displayName })
          .eq('user_id', result.user.id)
      } catch (profileError) {
        console.error(profileError)
      }
    }

    if (!result.session) {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })
      if (signInError) {
        return { needsConfirmation: true }
      }
      clearRequestAuth()
      throw redirect({ href: settings.signUp })
    }

    clearRequestAuth()
    throw redirect({ href: settings.signUp })
  })

export const signOutFn = createServerFn({ method: 'POST' }).handler(
  async () => {
    markPrivateNoStore()
    const supabase = createClient()
    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error(error)
      throw new Error('Unable to sign out')
    }

    clearRequestAuth()
    const settings = await loadAuthRedirectSettings()
    throw redirect({ href: settings.signOut })
  },
)

export const requestPasswordResetFn = createServerFn({ method: 'POST' })
  .validator((input: unknown) => {
    if (typeof input !== 'object' || input === null) {
      throw new Error('Unable to send reset email')
    }

    const data = input as Record<string, unknown>
    return { email: parseEmail(data.email) }
  })
  .handler(async ({ data }) => {
    markPrivateNoStore()
    try {
      assertRateLimit('auth:forgot-password', 8, 60 * 60 * 1000)
    } catch {
      return { ok: true as const }
    }
    const supabase = createClient()
    const origin = getAppOrigin()
    const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: `${origin}/auth/callback?next=${encodeURIComponent('/reset-password')}`,
    })

    if (error) {
      console.error(error)
    }

    return { ok: true as const }
  })

export const updatePasswordFn = createServerFn({ method: 'POST' })
  .validator((input: unknown) => {
    if (typeof input !== 'object' || input === null) {
      throw new Error('Unable to update password')
    }

    const data = input as Record<string, unknown>
    return {
      password: parsePassword(data.password),
      currentPassword:
        typeof data.currentPassword === 'string'
          ? data.currentPassword
          : undefined,
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
    const { data: sessionData } = await supabase.auth.getUser()
    if (!sessionData.user) {
      return { error: 'Unable to update password' }
    }
    if (data.currentPassword) {
      const email = sessionData.user.email
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
    }
    const { error } = await supabase.auth.updateUser({
      password: data.password,
    })

    if (error) {
      console.error(error)
      return { error: 'Unable to update password' }
    }

    const access = await getAccessWithClient(user.id, supabase)
    clearRequestAuth()
    const href = await passwordResetLandingPath(access)
    throw redirect({ href })
  })
