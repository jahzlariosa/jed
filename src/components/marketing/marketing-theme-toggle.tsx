import { Moon, Sun } from '@phosphor-icons/react'
import { useEffect, useState } from 'react'

import {
  applyMarketingTheme,
  readMarketingTheme,
  type MarketingThemePreference,
} from '#/lib/marketing/marketing-theme'
import { phosphorIcon } from '#/lib/icon'

export function MarketingThemeToggle() {
  const [theme, setTheme] = useState<MarketingThemePreference>('light')

  useEffect(() => {
    setTheme(readMarketingTheme())
  }, [])

  function toggle() {
    const next: MarketingThemePreference = theme === 'dark' ? 'light' : 'dark'
    applyMarketingTheme(next)
    setTheme(next)
  }

  const isDark = theme === 'dark'

  return (
    <button
      type="button"
      className="marketing-icon-btn"
      onClick={toggle}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark ? (
        <Sun {...phosphorIcon} size={16} />
      ) : (
        <Moon {...phosphorIcon} size={16} />
      )}
    </button>
  )
}
