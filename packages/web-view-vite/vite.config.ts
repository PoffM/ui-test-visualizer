import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import solid from 'vite-plugin-solid'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [solid(), tailwindcss()],
  build: {
    outDir: '../../build-prod/web-view-vite',
    rollupOptions: {
      output: {
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name].[ext]',
      },
    },
  },
  resolve: {
    alias: {
      'lucide-solid/icons': fileURLToPath(
        new URL(
          './node_modules/lucide-solid/dist/source/icons',
          // eslint-disable-next-line ts/prefer-ts-expect-error
          // @ts-ignore should work because this is a config file, doesn't run in the app
          import.meta.url,
        ),
      ),
    },
  },
})
