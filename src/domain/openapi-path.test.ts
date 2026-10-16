import { describe, expect, it } from 'vitest'

import { generateOpenApiDocument } from './openapi.server'

describe('generateOpenApiDocument paths', () => {
  it('uses OpenAPI brace path parameters', () => {
    const doc = generateOpenApiDocument('https://example.com')
    expect(doc.paths['/api/v1/content/{id}']).toBeDefined()
    expect(doc.paths['/api/v1/posts/{postId}']).toBeDefined()
    expect(doc.paths['/api/v1/users/{userId}/deactivate']).toBeDefined()
  })
})
