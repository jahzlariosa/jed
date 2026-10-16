import { describe, expect, it } from 'vitest'

import {
  detectRedirectCycle,
  escapeCsvField,
  normalizeImportedCsvField,
  parseCsvTable,
  parseRedirectCsvRows,
} from '#/lib/cms/redirect-csv'

describe('redirect csv helpers', () => {
  it('always quotes fields and prefixes formula-like values with a leading apostrophe', () => {
    expect(escapeCsvField('=cmd')).toBe(`"'=cmd"`)
    expect(escapeCsvField('hello')).toBe('"hello"')
    expect(escapeCsvField('\thello')).toBe(`"'\thello"`)
  })

  it('round-trips formula-guarded export through import', () => {
    const guarded = '=cmd'
    const cell = escapeCsvField(guarded)
    const parsed = parseCsvTable(`x,${cell},301,true,false`)[0]
    expect(normalizeImportedCsvField(parsed[1] ?? '')).toBe(guarded)
  })

  it('parses quoted commas and escaped quotes in one pass', () => {
    expect(parseCsvTable('"a,b",""')[0]).toEqual(['a,b', ''])
  })

  it('strips formula-guard prefix on import', () => {
    expect(normalizeImportedCsvField("'=cmd")).toBe('=cmd')
    const csv = `from_path,to_path,status_code,enabled,is_external
/from,"'=gone",410,true,false`
    const parsed = parseRedirectCsvRows(csv, [])
    expect('error' in parsed).toBe(false)
    if (!('error' in parsed)) {
      expect(parsed.rows[0]?.toPath).toBe('=gone')
    }
  })

  it('parses quoted fields that span newlines', () => {
    const csv = `from_path,to_path,status_code,enabled,is_external
"/from","/to",301,true,false`
    const parsed = parseRedirectCsvRows(csv, [])
    expect('error' in parsed).toBe(false)
    if (!('error' in parsed)) {
      expect(parsed.rows[0]?.fromPath).toBe('/from')
    }
  })

  it('detects redirect cycles', () => {
    expect(
      detectRedirectCycle([
        { from: '/a', to: '/b' },
        { from: '/b', to: '/a' },
      ]),
    ).toBe(true)
  })
})
