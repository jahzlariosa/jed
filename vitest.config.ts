import { defineConfig } from 'vitest/config'

// Separate from vite.config.ts on purpose: unit tests only need path resolution,
// not the TanStack Start / Nitro / Tailwind build plugins.
export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
