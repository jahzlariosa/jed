import { describe, expect, it } from 'vitest'

import {
  parseHighlightMarks,
  plainSearchHeadline,
  stripHighlightMarks,
} from './search'

describe('search highlights', () => {
  it('strips mark tags', () => {
    expect(stripHighlightMarks('Hello <mark>world</mark>')).toBe('Hello world')
  })

  it('parses mark segments', () => {
    expect(parseHighlightMarks('Auth <mark>guide</mark> here')).toEqual([
      { highlighted: false, text: 'Auth ' },
      { highlighted: true, text: 'guide' },
      { highlighted: false, text: ' here' },
    ])
  })

  it('strips tags for API plain headlines without entity encoding', () => {
    expect(parseHighlightMarks('Tom & Jerry <mark>a</mark>')).toEqual([
      { highlighted: false, text: 'Tom & Jerry ' },
      { highlighted: true, text: 'a' },
    ])
    expect(plainSearchHeadline('<mark>hi</mark> there')).toBe('hi there')
  })
})
