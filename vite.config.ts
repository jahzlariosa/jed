import { defineConfig } from 'vite'

import { appEnvPlugin } from './src/lib/env/vite-plugin.ts'
import { devtools } from '@tanstack/devtools-vite'
import { nitro } from 'nitro/vite'

import { tanstackStart } from '@tanstack/react-start/plugin/vite'

import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const config = defineConfig({
  resolve: { tsconfigPaths: true },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('@blocknote')) {
            return 'blocknote'
          }
          if (id.includes('/src/routes/_authenticated/admin')) {
            return 'admin-routes'
          }
        },
      },
    },
  },
  plugins: [
    appEnvPlugin(),
    devtools(),
    tailwindcss(),
    tanstackStart(),
    // Deploy target is Vercel: emits the Vercel Build Output API (.vercel/output).
    // Local dev (`vite dev`) is unaffected.
    nitro({ preset: 'vercel' }),
    viteReact(),
  ],
})

export default config
