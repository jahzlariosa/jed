import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { slugify } from '../lib/slugify.js'

describe('slugify', () => {
  it('lowercases and hyphenates spaces', () => {
    assert.equal(slugify('My Client Site'), 'my-client-site')
  })

  it('returns my-site for empty input', () => {
    assert.equal(slugify('   '), 'my-site')
  })

  it('prefixes numeric-leading names', () => {
    assert.equal(slugify('2026-site'), 'site-2026-site')
  })
})
