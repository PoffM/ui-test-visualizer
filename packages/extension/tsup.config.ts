import fsSync from 'node:fs'
import fs from 'node:fs/promises'
import path from 'node:path'
import { defineConfig } from 'tsup'

export default defineConfig(options => ({
  entry: {
    'extension': './src/extension/extension.ts',
    'inject-cli': './src/test-process/inject-cli.ts',
    'inject-test': './src/test-process/inject-test.ts',
    'load-styles': './src/test-process/load-styles-worker.ts',
  },
  external: ['vscode', './load-styles'],
  noExternal: [
    'get-port',
    'find-up',
    'postcss-load-config',
    'lodash',
    'tinyspy',
    'replicate-dom',
  ],
  // Vite handles the webview src watching
  ignoreWatch: ['src/web-view-vite'],
  target: 'esnext',
  env: {
    NODE_ENV: options.watch ? 'development' : 'production',
  },
  plugins: [
    {
      // TODO simpler way to make an svg green
      name: 'prepare-green-icon',
      async buildStart() {
        console.log('Preparing green debug icon')
        const src = path.resolve(
          __dirname,
          './node_modules/@vscode/codicons/src/icons/debug.svg',
        )
        const dest = path.resolve(__dirname, './dist/debug.svg')

        // Only generate if the source is newer than the destination
        {
          const srcTimestamp = (await fs.stat(src)).mtimeMs
          const destTimestamp = fsSync.existsSync(dest)
            ? (await fs.stat(dest)).mtimeMs
            : 0

          if (destTimestamp >= srcTimestamp) {
            return
          }
        }

        const color = '#89D185'
        const newSvg = (await fs.readFile(src, 'utf-8')).replace(
          'fill="currentColor"',
          `fill="${color}"`,
        )
        await fs.mkdir(path.resolve(__dirname, './dist/'), { recursive: true })
        await fs.writeFile(dest, newSvg)
        console.log('Green debug icon prepared')
      },
    },
  ],
}))
