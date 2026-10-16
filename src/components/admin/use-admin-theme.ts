import { useEffect, useState } from 'react'

import {
  ADMIN_THEME_STORAGE_KEY,
  type AdminResolvedTheme,
  type AdminThemePreference,
  isAdminThemePreference,
  readAdminThemePreference,
  resolveAdminTheme,
} from '#/lib/admin/admin-theme'

function applyResolvedTheme(theme: AdminResolvedTheme) {
  document.documentElement.setAttribute('data-admin-theme', theme)
  const root = document.querySelector('.jed-admin')
  root?.setAttribute('data-theme', theme)
}

export function useAdminTheme() {
  const [preference, setPreferenceState] = useState<AdminThemePreference>(() =>
    readAdminThemePreference(),
  )
  const [resolved, setResolved] = useState<AdminResolvedTheme>(() =>
    resolveAdminTheme(
      readAdminThemePreference(),
      typeof window !== 'undefined' &&
        window.matchMedia('(prefers-color-scheme: dark)').matches,
    ),
  )

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const sync = () => {
      const pref = readAdminThemePreference()
      const next = resolveAdminTheme(pref, media.matches)
      setPreferenceState(pref)
      setResolved(next)
      applyResolvedTheme(next)
    }
    sync()
    const onMedia = () => {
      if (readAdminThemePreference() === 'system') {
        sync()
      }
    }
    media.addEventListener('change', onMedia)
    return () => media.removeEventListener('change', onMedia)
  }, [])

  function setPreference(next: AdminThemePreference) {
    try {
      window.localStorage.setItem(ADMIN_THEME_STORAGE_KEY, next)
    } catch {
      // ignore
    }
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const resolvedTheme = resolveAdminTheme(next, media.matches)
    setPreferenceState(next)
    setResolved(resolvedTheme)
    applyResolvedTheme(resolvedTheme)
  }

  return { preference, resolved, setPreference }
}

export function readStoredAdminThemePreference(): AdminThemePreference {
  return readAdminThemePreference()
}

export { isAdminThemePreference }
