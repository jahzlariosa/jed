import { describe, expect, it } from 'vitest'

import { matchDomainOperation } from './registry'

describe('matchDomainOperation', () => {
  it('matches content by id before list path collision', () => {
    const match = matchDomainOperation(
      'GET',
      '/api/v1/content/550e8400-e29b-41d4-a716-446655440000',
    )
    expect(match?.operation.id).toBe('get_content')
    expect(match?.params.id).toBe('550e8400-e29b-41d4-a716-446655440000')
  })

  it('matches public search', () => {
    const match = matchDomainOperation('GET', '/api/v1/public/search')
    expect(match?.operation.id).toBe('search_public')
  })
})
