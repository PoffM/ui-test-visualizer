import fsSync from 'node:fs'
import fs from 'node:fs/promises'
import path from 'pathe'
import { defineConfig } from 'tsup'
import { build as esbuild } from 'esbuild'

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
    metafile: true,
    treeshake: !options.watch,
    entry: {
      'extension': './src/extension.ts',
      'ui-test-visualizer-cli-setup': '../test-setup/src/vitest-cli-setup.ts',
      'ui-test-visualizer-test-setup': '../test-setup/src/test-setup.ts',
      'transform-css': './src/transform-css/transform-css.ts',
    },
    outDir,
    external: ['vscode', 'jest-resolve/build/default_resolver', 'jiti', './transform-css', 'babel-jest', '@babel/core'],
    noExternal: [
      /^((?!(vscode)|(jest-resolve\/build\/default_resolver)|(jiti)|(babel-jest)|(@babel\/core)|(.\/transform-css)).)*$/,
      '@vscode/extension-telemetry',
    ],
    // Vite handles the webview's hot reload
    ignoreWatch: ['src/web-view-vite', outDir],
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
        name: 'copy-files',
        buildStart: lodash.once(async () => {
          const root = path.join(__dirname, '../..')
          const files = ['README.md', 'icon.png', 'CHANGELOG.md']
          for (const file of files) {
            await fs.copyFile(
              path.join(root, file),
              path.join(outDir, file),
            )
          }

          console.log(`Copied files: ${files.join(', ')}`)
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
        name: 'copy-wasm-files',
        buildEnd: lodash.once(async () => {
          console.log('Copying Tailwind wasm file to the build dir')
          await fs.cp(
            path.join(__dirname, './node_modules/@tailwindcss/oxide-wasm32-wasi/tailwindcss-oxide.wasm32-wasi.wasm'),
            path.join(outDir, 'tailwindcss-oxide.wasm32-wasi.wasm'),
          )

          console.log('Copying Oxc parser wasm file to the build dir')
          await fs.cp(
            path.join(__dirname, './node_modules/@oxc-parser/binding-wasm32-wasi/parser.wasm32-wasi.wasm'),
            path.join(outDir, 'parser.wasm32-wasi.wasm'),
          )

          console.log('Building wasi-worker.mjs')
          await esbuild({
            entryPoints: ['./src/wasi-worker.mjs'],
            bundle: true,
            treeShaking: true,
            outfile: path.join(outDir, 'wasi-worker.mjs'),
            format: 'esm',
            target: 'esnext',
            external: ['node:*'],
          })
        }),
      },
    ],
  }
})
