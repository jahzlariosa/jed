import type { CSSProperties, ReactNode } from 'react'
import { EnvelopeSimple, ShieldCheck } from '@phosphor-icons/react'

import { MAIN_CONTENT_ID, SkipLink } from '#/components/a11y/skip-link'
import { AuthBrandAside } from '#/components/auth/auth-brand-aside'
import { AuthBrandMark } from '#/components/auth/auth-brand-mark'
import { applyBrandCss } from '#/lib/cms/brand'
import { resolvePublicBrandHex } from '#/lib/cms/brand-defaults'
import { phosphorIcon } from '#/lib/icon'
import { cn } from '@/lib/utils'
import '#/styles/auth-marketing.css'

const heroIcons = {
  shield: ShieldCheck,
  envelope: EnvelopeSimple,
} as const

export function AuthShell({
  siteName,
  brandHex,
  title,
  description,
  heroIcon,
  children,
}: {
  siteName: string
  brandHex: string
  title: string
  description: ReactNode
  heroIcon?: keyof typeof heroIcons
  children: ReactNode
}) {
  const brandStyle = applyBrandCss(
    resolvePublicBrandHex(brandHex),
  ) as CSSProperties

  const HeroIcon = heroIcon ? heroIcons[heroIcon] : null

  return (
    <div
      className="jed-auth grid min-h-dvh w-full lg:grid-cols-[1.05fr_0.95fr]"
      style={brandStyle}
    >
      <SkipLink />
      <aside
        aria-label={`About ${siteName}`}
        className="auth-brand-panel relative flex flex-col overflow-hidden p-5 text-white lg:min-h-dvh lg:p-12 lg:pb-12"
      >
        <div className="flex items-center gap-3 lg:hidden">
          <AuthBrandMark siteName={siteName} size="nav" surface="brand" />
          <span className="text-[13.5px] font-semibold tracking-tight">
            {siteName}
          </span>
        </div>
        <div className="hidden min-h-dvh flex-col lg:flex">
          <AuthBrandAside siteName={siteName} />
        </div>
      </aside>

      <div className="auth-form-panel flex min-h-dvh flex-col">
        <main
          id={MAIN_CONTENT_ID}
          tabIndex={-1}
          className="mx-auto flex w-full max-w-[25rem] flex-1 flex-col justify-center px-5 py-7 outline-none sm:max-w-[400px] sm:px-10 sm:py-12 lg:px-10"
        >
          {HeroIcon ? (
            <div
              className="mb-5 grid size-14 place-items-center rounded-[14px] bg-[var(--brand-wash)] text-[var(--brand)]"
              aria-hidden
            >
              <HeroIcon {...phosphorIcon} className="size-[26px]" />
            </div>
          ) : (
            <AuthBrandMark
              siteName={siteName}
              size="form"
              surface="brand"
              className="mb-7 hidden lg:inline-flex"
            />
          )}
          <h1
            className={cn(
              'font-semibold tracking-[-0.03em] text-foreground',
              heroIcon
                ? 'text-[26px] leading-[1.15] sm:text-[32px]'
                : 'text-[26px] sm:text-[32px]',
            )}
          >
            {title}
          </h1>
          <p className="mt-2 mb-7 max-w-[36ch] text-base text-muted-foreground">
            {description}
          </p>
          {children}
        </main>
      </div>
    </div>
  )
}
