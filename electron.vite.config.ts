import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'electron-vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

export default defineConfig({
  main: {
    build: {
      externalizeDeps: true,
      rollupOptions: {
        input: {
          index: 'src/main/index.ts',
        },
        external: ['./../generated/prisma/client', '@prisma/client'],
      },
    },
  },
  preload: {
    build: {
      externalizeDeps: true,
      rollupOptions: {
        input: {
          index: 'src/preload/index.ts',
        },
      },
    },
  },
  renderer: {
    build: {
      rollupOptions: {
        input: {
          index: 'src/renderer/index.html',
        },
      },
    },
    plugins: [tailwindcss(), svelte()],
  },
})
