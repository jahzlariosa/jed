import { describe, expect, it } from 'vitest'

import {
  collectAppliedMigrationKeys,
  migrationTemplateAppliedState,
} from './migration-applied'

describe('migration applied matching', () => {
  it('matches version and migration name', () => {
    const applied = collectAppliedMigrationKeys([
      { version: '20261015183000', name: 'schema_migrations_name' },
    ])
    expect(
      migrationTemplateAppliedState(
        '20261015182000_api_tokens.sql',
        'migration',
        applied,
      ),
    ).toBe('pending')
    expect(
      migrationTemplateAppliedState(
        '20261015183000_schema_migrations_name.sql',
        'migration',
        applied,
      ),
    ).toBe('applied')
  })
})
