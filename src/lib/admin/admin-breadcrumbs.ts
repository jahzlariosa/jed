export type AdminBreadcrumbSegment = {
  label: string
  to?: string
}

const SECTION_LABELS: Record<string, string> = {
  '/admin': 'Dashboard',
  '/admin/content': 'Content',
  '/admin/media': 'Media',
  '/admin/posts': 'Blog',
  '/admin/users': 'Users',
  '/admin/redirects': 'Redirects',
  '/admin/audit': 'Audit log',
  '/admin/inbox': 'Inbox',
  '/admin/sql-templates': 'SQL templates',
  '/admin/database': 'Database',
  '/admin/settings': 'Settings',
  '/admin/api': 'API and MCP',
}

function editorItemLabel(paramId: string | undefined): string {
  if (!paramId || paramId === 'new') {
    return 'New'
  }
  return 'Editor'
}

export function buildAdminBreadcrumbs(
  pathname: string,
  params: Record<string, string | undefined>,
): AdminBreadcrumbSegment[] {
  const crumbs: AdminBreadcrumbSegment[] = [{ label: 'Admin', to: '/admin' }]

  if (pathname === '/admin' || pathname === '/admin/') {
    crumbs.push({ label: 'Dashboard' })
    return crumbs
  }

  const contentId = params.contentId
  if (pathname.startsWith('/admin/content/') && contentId) {
    crumbs.push({ label: 'Content', to: '/admin/content' })
    crumbs.push({ label: editorItemLabel(contentId) })
    return crumbs
  }

  const postId = params.postId
  if (pathname.startsWith('/admin/posts/') && postId) {
    crumbs.push({ label: 'Blog', to: '/admin/posts' })
    crumbs.push({ label: editorItemLabel(postId) })
    return crumbs
  }

  const base = pathname.replace(/\/$/, '')
  const section = SECTION_LABELS[base]
  if (section) {
    crumbs.push({ label: section })
  }

  return crumbs
}
