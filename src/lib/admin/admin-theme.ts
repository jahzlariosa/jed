export const ADMIN_THEME_STORAGE_KEY = 'amianan-admin-theme'

export type AdminThemePreference = 'light' | 'dark' | 'system'

export type AdminResolvedTheme = 'light' | 'dark'

export function isAdminThemePreference(
  value: string | null,
): value is AdminThemePreference {
  return value === 'light' || value === 'dark' || value === 'system'
}

export function readAdminThemePreference(): AdminThemePreference {
  if (typeof window === 'undefined') {
    return 'system'
  }
  try {
    const stored = window.localStorage.getItem(ADMIN_THEME_STORAGE_KEY)
    if (isAdminThemePreference(stored)) {
      return stored
    }
  } catch {
    // ignore
  }
  return 'system'
}

export function resolveAdminTheme(
  preference: AdminThemePreference,
  prefersDark: boolean,
): AdminResolvedTheme {
  if (preference === 'dark') {
    return 'dark'
  }
  if (preference === 'light') {
    return 'light'
  }
  return prefersDark ? 'dark' : 'light'
}

export function adminThemeInitScript(): string {
  return `(function(){try{var p=location.pathname;if(p.indexOf('/admin')!==0)return;var k='${ADMIN_THEME_STORAGE_KEY}';var s=localStorage.getItem(k);var pref=s==='light'||s==='dark'||s==='system'?s:'system';var dark=pref==='dark'||(pref==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.setAttribute('data-admin-theme',dark?'dark':'light');}catch(e){}})();`
}
