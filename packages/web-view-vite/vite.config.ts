import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import solid from 'vite-plugin-solid'

export default defineConfig({
  plugins: [solid()],
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
          import.meta.url,
        ),
      ),
    },
  },
})
