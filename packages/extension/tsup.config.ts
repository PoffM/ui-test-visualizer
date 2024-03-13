import fsSync from 'node:fs'
import fs from 'node:fs/promises'
import path from 'node:path'
import { defineConfig } from 'tsup'

// eslint-disable-next-line import/no-named-default
import { default as lodash } from 'lodash'

import rootPkg from '../../package.json'

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
      name: 'make-dist-folder',
      buildStart: lodash.once(async () => {
        await fs.mkdir(path.resolve(__dirname, './dist/'), { recursive: true })
      }),
    },
    {
      name: 'add-package.json',
      buildStart: lodash.once(async () => {
        const omitKeys: (keyof typeof rootPkg)[] = ['scripts', 'devDependencies', 'pnpm']
        const prodPackageJson = {
          ...lodash.omit(rootPkg, omitKeys),
          main: './extension.js',
        }

        await fs.writeFile(
          path.resolve(__dirname, './dist/package.json'),
          JSON.stringify(prodPackageJson, null, 2),
        )
        console.log('Created dist/package.json')
      }),
    },
    {
      name: 'add-readme',
      buildStart: lodash.once(async () => {
        await fs.copyFile(
          path.resolve(__dirname, '../../README.md'),
          path.resolve(__dirname, './dist/README.md'),
        )
        console.log('Created dist/README.md')
      }),
    },
    {
      // TODO simpler way to make an svg green
      name: 'prepare-green-icon',
      buildStart: lodash.once(async () => {
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
        await fs.writeFile(dest, newSvg)
        console.log('Green debug icon prepared')
      }),
    },
  ],
}))
