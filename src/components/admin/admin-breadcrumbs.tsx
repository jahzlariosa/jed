import { Link, useParams, useRouterState } from '@tanstack/react-router'

import { buildAdminBreadcrumbs } from '#/lib/admin/admin-breadcrumbs'

export function AdminBreadcrumbs() {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })
  const params = useParams({ strict: false }) as Record<
    string,
    string | undefined
  >
  const segments = buildAdminBreadcrumbs(pathname, params)

  return (
    <nav aria-label="Breadcrumb" className="admin-breadcrumbs">
      <ol className="admin-breadcrumbs-list">
        {segments.map((segment, index) => {
          const isLast = index === segments.length - 1
          const key = segment.to
            ? `${segment.label}-${segment.to}`
            : segment.label
          return (
            <li key={key} className="admin-breadcrumbs-item">
              {segment.to && !isLast ? (
                <Link to={segment.to} className="admin-breadcrumbs-link">
                  {segment.label}
                </Link>
              ) : (
                <span
                  className="admin-breadcrumbs-current"
                  aria-current={isLast ? 'page' : undefined}
                >
                  {segment.label}
                </span>
              )}
              {!isLast ? (
                <span className="admin-breadcrumbs-sep" aria-hidden>
                  /
                </span>
              ) : null}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
