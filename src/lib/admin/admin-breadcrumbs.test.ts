import { describe, expect, it } from 'vitest'

import { buildAdminBreadcrumbs } from '#/lib/admin/admin-breadcrumbs'

describe('buildAdminBreadcrumbs', () => {
  it('labels the dashboard', () => {
    expect(buildAdminBreadcrumbs('/admin', {})).toEqual([
      { label: 'Admin', to: '/admin' },
      { label: 'Dashboard' },
    ])
  })

  it('labels content editor routes', () => {
    expect(
      buildAdminBreadcrumbs('/admin/content/abc', { contentId: 'abc' }),
    ).toEqual([
      { label: 'Admin', to: '/admin' },
      { label: 'Content', to: '/admin/content' },
      { label: 'Editor' },
    ])
  })

  it('labels list sections', () => {
    expect(buildAdminBreadcrumbs('/admin/posts', {})).toEqual([
      { label: 'Admin', to: '/admin' },
      { label: 'Blog' },
    ])
  })
})
