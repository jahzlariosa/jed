import { loadEnv, type Plugin } from 'vite'

import { assertAppEnvAtStartup, collectAppEnvIssues } from './schema.ts'

/**
 * Validates env when the dev server or production build starts.
 * Server-only names are read here and are not added to the client env prefix.
 */
export function appEnvPlugin(): Plugin {
  return {
    name: 'jed-app-env',
    configResolved(config) {
      const loaded = loadEnv(config.mode, config.root, '')
      const production = config.command === 'build'
      const issues = collectAppEnvIssues({
        ...loaded,
        NODE_ENV: production
          ? 'production'
          : (loaded.NODE_ENV ?? 'development'),
      })
      assertAppEnvAtStartup(production ? 'build' : 'serve', issues)
    },
  }
}
