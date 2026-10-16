import { describe, expect, it } from 'vitest'

import { escapeLike, quotePostgrestFilterValue } from '#/auth/validators'

/** Mirrors fetchAuditDirectory search filter construction. */
function buildAuditSearchOrFilter(q: string): string {
  const escaped = escapeLike(q)
  const pattern = quotePostgrestFilterValue(`%${escaped}%`)
  return `action.ilike.${pattern},target_type.ilike.${pattern},target_id.ilike.${pattern}`
}

describe('audit directory search filter', () => {
  it('quotes ilike patterns so injected commas stay inside one value', () => {
    const filter = buildAuditSearchOrFilter('foo,actor_id.eq.anything')
    expect(filter.startsWith('action.ilike."%foo,actor')).toBe(true)
    expect(filter).toContain('id.eq.anything')
    expect(filter).not.toMatch(/ilike\.%[^"]*,/)
  })
})
