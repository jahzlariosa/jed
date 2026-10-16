import { describe, expect, it } from 'vitest'

import {
  databaseActivityLoadError,
  databaseInsightLoadError,
} from '#/lib/admin/database/database-insight-errors'

describe('databaseInsightLoadError', () => {
  it('maps permission denied without migration copy', () => {
    expect(
      databaseInsightLoadError({
        code: '42501',
        message: 'permission denied for function admin_database_overview',
      }),
    ).toBe('You do not have permission to load database insights.')
    expect(databaseInsightLoadError({ message: 'permission denied' })).toBe(
      'You do not have permission to load database insights.',
    )
  })

  it('maps missing RPC and SQL errors to user copy', () => {
    expect(
      databaseInsightLoadError({
        code: 'PGRST202',
        message: 'Could not find the function public.admin_database_overview',
      }),
    ).toBe('Database insights are not available on this project.')
    expect(
      databaseInsightLoadError({
        code: '42883',
        message: 'function pg_catalog.coalesce(text, unknown) does not exist',
      }),
    ).toBe('Database insights could not be loaded. Try again later.')
  })
})

describe('databaseActivityLoadError', () => {
  it('returns activity-specific copy', () => {
    expect(
      databaseActivityLoadError({
        code: '42883',
        message: 'function pg_catalog.coalesce(text, unknown) does not exist',
      }),
    ).toBe('Activity stats could not be loaded. Try again later.')
  })
})
