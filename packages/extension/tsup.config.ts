import fsSync from 'node:fs'
import fs from 'node:fs/promises'
import path from 'node:path'
import { defineConfig } from 'tsup'

// eslint-disable-next-line import/no-named-default
import { default as lodash } from 'lodash'

import rootPkg from '../../package.json'

export default defineConfig((options) => {
  const outDir = path.join(
    __dirname,
    '../..',
    options.watch ? 'build-dev' : 'build-prod',
  )

  return {
    treeshake: !options.watch,
    entry: {
      'extension': './src/extension/extension.ts',
      'inject-cli': './src/test-process/inject-cli.ts',
      'inject-test': './src/test-process/inject-test.ts',
      'load-styles': '../load-styles/src/load-styles-worker.ts',
    },
    outDir,
    external: ['vscode', './load-styles', 'lightningcss', 'jest-resolve/build/default_resolver', 'ts-node', 'vite'],
    noExternal: [
      /^((?!(vscode)|(\.\/load-styles)|(lightningcss)|(jest-resolve\/build\/default\_resolver)|(ts-node)|(vite)).)*$/,
    ],
    // Vite handles the webview src watching
    ignoreWatch: ['src/web-view-vite'],
    target: 'esnext',
    env: {
      NODE_ENV: options.watch ? 'development' : 'production',
    },
    plugins: [
      {
        name: 'make-build-folder',
        buildStart: lodash.once(async () => {
          await fs.mkdir(outDir, { recursive: true })
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
            path.join(outDir, 'package.json'),
            JSON.stringify(prodPackageJson, null, 2),
          )
          console.log('Created build package.json')
        }),
      },
      {
        name: 'add-readme',
        buildStart: lodash.once(async () => {
          await fs.copyFile(
            path.join(__dirname, '../../README.md'),
            path.join(outDir, 'README.md'),
          )
          console.log('Created build README.md')
        }),
      },
      {
      // TODO simpler way to make an svg green
        name: 'prepare-green-icon',
        buildStart: lodash.once(async () => {
          console.log('Preparing green debug icon')
          const src = path.join(
            __dirname,
            './node_modules/@vscode/codicons/src/icons/debug.svg',
          )
          const dest = path.join(outDir, 'debug.svg')

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
      {
      // The load-styles script requires its own node_modules directory.
      // It uses Vite to preprocess the CSS files, which can't be bundled into one file
      // because it expects some of its files to exist at relative paths.
        name: 'copy-load-styles-deps',
        buildStart: lodash.once(async () => {
          console.log('Copying load-styles dependencies to build node_modules dir')
          const deps = [
            'esbuild',
            'vite',
            'rollup',
            '@rollup/rollup-linux-x64-gnu',
            '@types/estree',
            'postcss',
            'nanoid',
            'picocolors',
            'source-map-js',
          ]

          const to = path.join(outDir, 'node_modules/')

          for (const dep of deps) {
            const from = path.join(__dirname, '../load-styles/node_modules/', dep)
            await fs.cp(
              from,
              path.join(to, dep),
              { dereference: true, recursive: true, force: true },
            )
          }
          console.log('Copied load-styles dependencies to build node_modules dir')
        }),
      },
    ],
  }
})
