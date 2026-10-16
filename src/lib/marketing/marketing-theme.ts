export const MARKETING_THEME_STORAGE_KEY = 'amianan-marketing-theme'

export type MarketingThemePreference = 'light' | 'dark'

export function marketingThemeInitScript() {
  return `(function(){try{var p=location.pathname;if(p.indexOf('/admin')===0)return;var k='${MARKETING_THEME_STORAGE_KEY}';var s=localStorage.getItem(k);var dark=s==='dark';if(dark){document.documentElement.classList.add('dark');}else{document.documentElement.classList.remove('dark');}}catch(e){}})();`
}

export function readMarketingTheme(): MarketingThemePreference {
  if (typeof window === 'undefined') {
    return 'light'
  }
  try {
    const stored = localStorage.getItem(MARKETING_THEME_STORAGE_KEY)
    return stored === 'dark' ? 'dark' : 'light'
  } catch {
    return 'light'
  }
}

export function applyMarketingTheme(theme: MarketingThemePreference) {
  if (typeof document === 'undefined') {
    return
  }
  document.documentElement.classList.toggle('dark', theme === 'dark')
  try {
    localStorage.setItem(MARKETING_THEME_STORAGE_KEY, theme)
  } catch {
    // ignore quota / private mode
  }
}
