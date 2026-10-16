import '@tanstack/react-start/server-only'

import { PERMISSIONS } from '#/auth/permissions'
import { requireCmsWrite } from '#/auth/admin-access.server'
import type { z } from 'zod'
import {
  parseSiteSettingsSaveBody,
  type siteSettingsSaveBodySchema,
} from '#/domain/api-schemas'
import type { DomainContext } from '#/domain/types'
import { writeAuditLog } from '#/lib/cms/audit.server'
import { actorHasVerifiedMfaFactor } from '#/auth/mfa-gate.server'
import { assertMfaPolicyAllowsSave } from '#/auth/mfa-policy'
import { clearPublicCache } from '#/lib/public-cache.server'

export async function saveSiteSettingsDomain(
  ctx: DomainContext,
  input: z.infer<typeof siteSettingsSaveBodySchema>,
) {
  const { user } = await requireCmsWrite(PERMISSIONS.settingsWrite)
  const supabase = ctx.supabase
  const { data: previous, error: readError } = await supabase
    .from('site_settings')
    .select('mfa_enabled, mfa_policy, timezone')
    .eq('id', 1)
    .maybeSingle()
  if (readError) {
    console.error(readError)
    throw new Error('Unable to save settings')
  }
  const data = parseSiteSettingsSaveBody(input, {
    previousTimezone: previous?.timezone,
  })
  const lockoutMessage = assertMfaPolicyAllowsSave({
    nextPolicy: data.mfaPolicy,
    actorHasVerifiedFactor: await actorHasVerifiedMfaFactor(supabase),
  })
  if (lockoutMessage) {
    throw new Error(lockoutMessage)
  }
  const { error } = await supabase
    .from('site_settings')
    .update({
      site_name: data.siteName,
      site_url: data.siteUrl || null,
      timezone: data.timezone,
      language: data.language,
      brand_hex: data.brandHex,
      logo_url: data.logoUrl,
      seo_title_template: data.seoTitleTemplate,
      seo_default_description: data.seoDefaultDescription,
      social_image_url: data.socialImageUrl,
      analytics_id: data.analyticsId,
      webhook_url: data.webhookUrl,
      redirect_after_sign_in_admin: data.redirectAfterSignInAdmin,
      redirect_after_sign_in_user: data.redirectAfterSignInUser,
      redirect_after_sign_up: data.redirectAfterSignUp,
      redirect_after_password_reset: data.redirectAfterPasswordReset,
      redirect_after_sign_out: data.redirectAfterSignOut,
      contact_email: data.contactEmail || null,
      mfa_enabled: data.mfaEnabled,
      mfa_policy: data.mfaPolicy,
      updated_at: new Date().toISOString(),
    })
    .eq('id', 1)
  if (error) {
    console.error(error)
    throw new Error('Unable to save settings')
  }
  if (
    previous &&
    (previous.mfa_enabled !== data.mfaEnabled ||
      previous.mfa_policy !== data.mfaPolicy)
  ) {
    await writeAuditLog(supabase, {
      actorUserId: user.id,
      action: 'site_settings.mfa_update',
      targetType: 'site_settings',
      targetId: '1',
      metadata: {
        mfa_enabled: data.mfaEnabled,
        mfa_policy: data.mfaPolicy,
        previous_mfa_enabled: previous.mfa_enabled,
        previous_mfa_policy: previous.mfa_policy,
      },
    })
  }
  clearPublicCache('public')
  return { ok: true as const }
}
