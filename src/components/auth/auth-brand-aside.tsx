import {
  FileText,
  Gear,
  MagnifyingGlass,
  Newspaper,
  SquaresFour,
} from '@phosphor-icons/react'

import { AuthBrandMark } from '#/components/auth/auth-brand-mark'
import { phosphorIcon } from '#/lib/icon'

export function AuthBrandAside({ siteName }: { siteName: string }) {
  return (
    <>
      <div className="relative z-1 flex items-center gap-3">
        <AuthBrandMark siteName={siteName} size="aside" surface="brand" />
        <span className="text-[15px] font-semibold tracking-tight">
          {siteName}
        </span>
      </div>

      <div className="relative z-1 mt-auto mb-9 hidden max-w-[27.5rem] flex-col lg:flex">
        <p className="mb-3.5 text-[13px] font-semibold tracking-[0.06em] text-[#a5b4fc] uppercase">
          Workspace
        </p>
        <p className="text-[2.5rem] leading-[1.12] font-semibold tracking-[-0.035em] text-white">
          Ship a branded site. Manage it in one calm admin.
        </p>
        <p className="mt-3.5 max-w-[36ch] text-base leading-normal text-white/68">
          Pages, blog, media, and API access share one accent you set once.
        </p>

        <div
          className="mt-7 overflow-hidden rounded-[14px] border border-white/12 bg-[#1f2937] text-[11px] shadow-[0_20px_40px_-20px_rgb(0_0_0/50%)]"
          aria-hidden
        >
          <div className="grid min-h-[168px] grid-cols-[120px_1fr]">
            <div className="border-r border-white/10 px-2.5 py-3">
              <NavRow active icon={SquaresFour} label="Dashboard" />
              <NavRow icon={FileText} label="Content" />
              <NavRow icon={Newspaper} label="Blog" />
              <NavRow icon={Gear} label="Settings" />
            </div>
            <div className="p-3">
              <div className="mb-2.5 flex h-7 items-center gap-1.5 rounded-[7px] border border-white/8 bg-white/6 px-2 text-white/40">
                <MagnifyingGlass {...phosphorIcon} className="size-3.5" />
                <span>Search...</span>
                <span className="ml-auto text-[9px] opacity-50">⌘K</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <StatCard label="Published" value="18" />
                <StatCard label="Drafts" value="5" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <p className="relative z-1 hidden text-[12.5px] text-white/45 lg:block">
        Secure sign-in for your workspace
      </p>
    </>
  )
}

function NavRow({
  icon: Icon,
  label,
  active = false,
}: {
  icon: typeof SquaresFour
  label: string
  active?: boolean
}) {
  return (
    <div
      className={
        active
          ? 'flex items-center gap-2 rounded-lg bg-[rgb(79_70_229/35%)] px-2 py-1.5 text-[11px] font-medium text-[#c7d2fe]'
          : 'flex items-center gap-2 rounded-lg px-2 py-1.5 text-[11px] font-medium text-white/55'
      }
    >
      <Icon {...phosphorIcon} className="size-3.5 shrink-0" />
      {label}
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="h-[52px] rounded-lg border border-white/8 bg-white/5 px-2.5 py-2">
      <div className="mb-1 text-[9px] text-white/45">{label}</div>
      <div className="text-base font-semibold text-white">{value}</div>
    </div>
  )
}
