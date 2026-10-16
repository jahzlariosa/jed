export const ADMIN_SETTINGS_TAB_SEARCH = { tab: 'general' as const }
export const ADMIN_API_TAB_SEARCH = { tab: 'tokens' as const }
export const ADMIN_USERS_TAB_SEARCH = {
  tab: 'members' as const,
  q: undefined,
  role: undefined,
  page: 1,
  pageSize: 25 as const,
}
export const ADMIN_REDIRECTS_TAB_SEARCH = { tab: 'rules' as const }
export const ADMIN_EDITOR_TAB_SEARCH = { tab: 'content' as const }
