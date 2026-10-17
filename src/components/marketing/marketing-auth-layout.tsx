import { EnvelopeSimple, Gear, ShieldCheck } from '@phosphor-icons/react'
import type { ReactNode } from 'react'

import { MarketingSiteShell } from '#/components/marketing/marketing-site-shell'
import { MAIN_CONTENT_ID } from '#/components/a11y/skip-link'
import type { PublicMarketing } from '#/lib/cms/public-marketing'
import { phosphorIcon } from '#/lib/icon'
import '#/styles/auth-marketing.css'

const authIcons = {
  shield: ShieldCheck,
  envelope: EnvelopeSimple,
  gear: Gear,
} as const

export function MarketingAuthLayout({
  marketing,
  title,
  description,
  icon,
  children,
}: {
  marketing: PublicMarketing
  title: string
  description: ReactNode
  icon?: keyof typeof authIcons
  children: ReactNode
}) {
  const Icon = icon ? authIcons[icon] : null

  return (
    <MarketingSiteShell marketing={marketing}>
      <main id={MAIN_CONTENT_ID} tabIndex={-1} className="outline-none">
        <div className="marketing-auth-stage">
          <div className="marketing-auth-card">
            {Icon ? (
              <div className="marketing-auth-icon brand" aria-hidden>
                <Icon {...phosphorIcon} size={20} />
              </div>
            ) : null}
            <h1>{title}</h1>
            <p className="marketing-auth-desc">{description}</p>
            {children}
          </div>
        </div>
      </main>
    </MarketingSiteShell>
  )
}
