import { cn } from '@/lib/utils'

const SECTIONS = [
  { id: 'profile', label: 'Profile' },
  { id: 'password', label: 'Password' },
  { id: 'two-factor', label: 'Two-factor' },
  { id: 'admin', label: 'Admin' },
  { id: 'sign-out', label: 'Sign out' },
] as const

export type AccountSectionId = (typeof SECTIONS)[number]['id']

export function AccountSectionNav({
  activeId,
  showAdmin,
  onSelect,
}: {
  activeId: AccountSectionId
  showAdmin: boolean
  onSelect: (id: AccountSectionId) => void
}) {
  const items = SECTIONS.filter((item) => item.id !== 'admin' || showAdmin)

  return (
    <>
      <nav
        className="account-nav-desktop sticky top-24 hidden shrink-0 flex-col md:flex"
        aria-label="Account sections"
      >
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            className={cn(
              'text-left text-[15px] text-[var(--account-muted)] hover:text-foreground',
              activeId === item.id && 'font-medium text-foreground',
            )}
            onClick={() => onSelect(item.id)}
          >
            {item.label}
          </button>
        ))}
      </nav>
      <div
        className="flex gap-2 overflow-x-auto pb-1 md:hidden"
        role="tablist"
        aria-label="Account sections"
      >
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={activeId === item.id}
            className={cn(
              'account-nav-chip text-[var(--account-muted)]',
              activeId === item.id && 'is-active',
            )}
            onClick={() => onSelect(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
    </>
  )
}

export function scrollToAccountSection(id: AccountSectionId) {
  document
    .getElementById(id)
    ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
