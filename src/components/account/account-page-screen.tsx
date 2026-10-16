import { useState } from 'react'

import { PERMISSIONS } from '#/auth'
import {
  AccountSectionNav,
  type AccountSectionId,
  scrollToAccountSection,
} from '#/components/account/account-section-nav'
import { AccountAdminCard } from '#/components/account/account-sign-out-section'
import { AccountMfaSection } from '#/components/account/account-mfa-section'
import { AccountPasswordSection } from '#/components/account/account-password-section'
import { AccountProfileSection } from '#/components/account/account-profile-section'
import { AccountSignOutSection } from '#/components/account/account-sign-out-section'
import { AccountUserAvatar } from '#/components/account/account-user-avatar'
import { profileDisplayLabel } from '#/lib/account/account-initials'
import '#/styles/account-page.css'

export type AccountPageProfile = {
  userId: string
  email: string | null
  displayName: string | null
  avatarUrl: string | null
  permissions: string[]
  mfa: { showEnrollmentUi: boolean }
}

export function AccountPageScreen({
  profile,
  siteName,
}: {
  profile: AccountPageProfile
  siteName: string
}) {
  const [activeId, setActiveId] = useState<AccountSectionId>('profile')
  const showAdmin = profile.permissions.includes(PERMISSIONS.adminAccess)
  const label = profileDisplayLabel({
    displayName: profile.displayName,
    email: profile.email,
  })

  function onSelectSection(id: AccountSectionId) {
    setActiveId(id)
    scrollToAccountSection(id)
  }

  return (
    <div className="jed-account marketing-main flex flex-1 flex-col outline-none">
      <div className="marketing-container w-full pt-10 pb-0 md:pt-10">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
          <AccountUserAvatar
            avatarUrl={profile.avatarUrl}
            displayName={profile.displayName}
            email={profile.email}
            size="lg"
          />
          <div className="min-w-0">
            <h1 className="text-[clamp(1.5rem,3vw,2rem)] font-semibold leading-tight tracking-tight">
              {label}
            </h1>
            <p className="mt-1 truncate text-[16px] account-muted">
              {profile.email}
            </p>
          </div>
        </header>

        <div className="mt-10 flex flex-col gap-8 md:mt-10 md:flex-row md:gap-10">
          <AccountSectionNav
            activeId={activeId}
            showAdmin={showAdmin}
            onSelect={onSelectSection}
          />
          <div className="account-section-gap flex min-w-0 flex-1 flex-col pb-10">
            <AccountProfileSection
              displayName={profile.displayName}
              email={profile.email}
              avatarUrl={profile.avatarUrl}
            />
            <AccountPasswordSection />
            <AccountMfaSection
              showEnrollmentUi={profile.mfa.showEnrollmentUi}
            />
            {showAdmin ? <AccountAdminCard /> : null}
            <AccountSignOutSection siteName={siteName} />
          </div>
        </div>
      </div>
    </div>
  )
}
