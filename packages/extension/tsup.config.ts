import fsSync from 'node:fs'
import fs from 'node:fs/promises'
import path from 'pathe'
import { defineConfig } from 'tsup'
import { globby } from 'globby'
import { deleteAsync } from 'del'

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
      'ui-test-visualizer-cli-setup': './src/test-process/vitest-cli-setup.ts',
      'ui-test-visualizer-test-setup': './src/test-process/test-setup.ts',
      'transform-css': './src/extension/transform-css.ts',
    },
    outDir,
    external: ['vscode', 'lightningcss', 'jiti', 'jest-resolve/build/default_resolver', 'ts-node', 'vite', './transform-css'],
    noExternal: [
      /^((?!(vscode)|(lightningcss)|(jiti)|(jest-resolve\/build\/default_resolver)|(ts-node)|(vite)|(.\/transform-css)).)*$/,
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
        // Vite seems to require a node_modules directory to work,
        // otherwise it can't find the required files to import/require.
        name: 'copy-vite-deps',
        buildStart: lodash.once(async () => {
          console.log('Copying node_modules folder required for the extension to use Vite')
          const from = path.join(__dirname, './vite-package/node_modules/')
          const to = path.join(outDir, 'node_modules/')
          await fs.cp(
            from,
            to,
            { recursive: true, force: true },
          )

          // Use cross-platform @rollup/wasm-node instead of native per-platform Rollup packages
          await deleteAsync(path.join(to, '@rollup'), { force: true })
          await fs.cp(
            path.join(__dirname, './vite-package/node_modules/@rollup/wasm-node'),
            path.join(to, 'rollup'),
            { dereference: true, recursive: true, force: true },
          )

          // Use cross-platform esbuild-wasm instead of native per-platform esbuild packages
          // This should be done in package.json's "overrides" section, but that has no effect.
          // TODO try "overrides" again after this issue is solved: https://github.com/npm/cli/issues/5443l
          await deleteAsync(path.join(to, 'esbuild'), { force: true })
          await deleteAsync(path.join(to, '@esbuild'), { force: true })
          await fs.rename(
            path.join(to, 'esbuild-wasm'),
            path.join(to, 'esbuild'),
          )

          // Delete unused files
          const toDelete = (await globby(
            ['**/bin/**/*', '**/.bin/**/*', '**/*.d.ts'],
            { cwd: to },
          )).filter(f => !f.startsWith('esbuild/'))
          await deleteAsync(toDelete.map(f => path.join(to, f)), { force: true })

          console.log('Copied Vite and its dependencies to the built extension\'s node_modules dir')
        }),
      },
    ],
  }
})
