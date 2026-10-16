import type { MfaAalLevel, MfaSiteSettings } from '#/auth/mfa-policy'
import type { AccessDto } from '#/auth/permissions'
import type { AppUser } from '#/auth/user'

export type AppShellMfaDto = {
  settings: MfaSiteSettings
  aal: MfaAalLevel | null
  hasVerifiedFactor: boolean
}

export type AppShellDto = {
  user: AppUser
  access: AccessDto
  mfa: AppShellMfaDto
}
