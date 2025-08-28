import fsSync from 'node:fs'
import fs from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import { findUp, findUpMultiple } from 'find-up'
import * as EnhancedResolve from 'enhanced-resolve'
import path from 'pathe'
import * as vscode from 'vscode'

// @ts-expect-error no ts declarations
import { Scanner } from '@tailwindcss/oxide-wasm32-wasi'

export async function applyTailwindV4(
  { code, tailwindJs, cssFilePath }: {
    code: string
    tailwindJs: string
    cssFilePath: string
  },
) {
  try {
    // Find the user's package.json with Tailwind installed
    const projectPkgJson = await (async () => {
      const pkgJsonPaths = await findUpMultiple('package.json', { cwd: path.dirname(cssFilePath) })
      for (const pkgJsonPath of pkgJsonPaths) {
        const hasTailwindInstalled = (() => {
          try {
            require.resolve('tailwindcss', { paths: [path.dirname(pkgJsonPath)] })
            return true
          }
          catch (error) {
            return false
          }
        })()
        if (hasTailwindInstalled) {
          return pkgJsonPath
        }
      }
      return null
    })()

    // Get the Tailwind candidates: strings that look like class names in the user's source files.
    const twCandidates = await (async () => {
      const scanner = new Scanner({
        sources: [{
          base: path.dirname(projectPkgJson ?? cssFilePath),
          pattern: '**/*',
          negated: false,
        }],
      })

      const candidates = await scanner.scan()
      return candidates
    })()

    // Try to get any aliases from the tsconfig.json in case the user has aliased paths like '@/*' -> 'src/*'
    const aliases = await (async () => {
      try {
        // Load tsconfig to get the 'paths' mappings.
        const tsModulePath = require.resolve('typescript', { paths: [path.dirname(cssFilePath)] })
        const ts = await import(tsModulePath) as typeof import('typescript')
        const tsConfigPath = await findUp('tsconfig.json', { cwd: path.dirname(cssFilePath) })
        if (tsConfigPath) {
          const configFileText = await fs.readFile(tsConfigPath, 'utf8')
          const tsConfigJson = ts.parseConfigFileTextToJson(tsConfigPath, configFileText)
          const tsConfig = ts.parseJsonConfigFileContent(
            tsConfigJson.config,
            ts.sys,
            path.dirname(tsConfigPath),
            {},
            tsConfigPath,
          )
          const paths = tsConfig.options.paths
          if (!paths) { return {} }

          const aliases = Object.fromEntries(
            // Convert globs to paths e.g. '@/*' -> '@'
            Object.entries(paths).map(([key, value]) => [
              key.replace(/\/\*$/, ''),
              value.map(v => path.resolve(path.dirname(tsConfigPath), v.replace(/\/\*$/, ''))),
            ]),
          )
          return aliases
        }
      }
      catch (error) {
        return {}
      }
    })()

    // Setup enhanced-resolvers to be used to resolve imports the css files.
    const modules = ['node_modules', ...(process.env.NODE_PATH ? [process.env.NODE_PATH] : [])]
    const cssResolver = EnhancedResolve.ResolverFactory.createResolver({
      fileSystem: new EnhancedResolve.CachedInputFileSystem(fsSync, 4000),
      useSyncFileSystemCalls: true,
      extensions: ['.css'],
      mainFields: ['style'],
      conditionNames: ['style'],
      modules,
      alias: aliases,
    })
    const esmResolver = EnhancedResolve.ResolverFactory.createResolver({
      fileSystem: new EnhancedResolve.CachedInputFileSystem(fsSync, 4000),
      useSyncFileSystemCalls: true,
      extensions: ['.js', '.json', '.node', '.ts'],
      conditionNames: ['node', 'import'],
      modules,
      alias: aliases,
    })
    const cjsResolver = EnhancedResolve.ResolverFactory.createResolver({
      fileSystem: new EnhancedResolve.CachedInputFileSystem(fsSync, 4000),
      useSyncFileSystemCalls: true,
      extensions: ['.js', '.json', '.node', '.ts'],
      conditionNames: ['node', 'require'],
      modules,
      alias: aliases,
    })

    // eslint-disable-next-line ts/no-var-requires, ts/no-require-imports
    const { compile } = require(tailwindJs)
    return (await compile(code, {
      base: path.dirname(cssFilePath),
      // eslint-disable-next-line unused-imports/no-unused-vars
      loadModule: async (id: string, base: string, resourceHint: 'plugin' | 'config') => {
        const resolvedPath = await runResolver(esmResolver, id, base).catch(() => runResolver(cjsResolver, id, base))
        if (!resolvedPath) {
          throw new Error(`Could not resolve '${id}' from '${base}'`)
        }

        if (id[0] !== '.') {
          const module = await import(pathToFileURL(resolvedPath).href)
          return {
            path: resolvedPath,
            base: path.dirname(resolvedPath),
            module: module.default ?? module,
          }
        }

        const module = await import(`${pathToFileURL(resolvedPath).href}?id=${Date.now()}`)

        return {
          path: resolvedPath,
          base: path.dirname(resolvedPath),
          module: module.default ?? module,
        }
      },
      loadStylesheet: async (id: string, base: string) => {
        const resolvedPath = await runResolver(cssResolver, id, base)
        if (!resolvedPath) {
          throw new Error(`Could not resolve '${id}' from '${base}'`)
        }

        const file = await fs.readFile(resolvedPath, 'utf-8')
        return {
          path: resolvedPath,
          base: path.dirname(resolvedPath),
          content: file,
        }
      },
    })).build(twCandidates)
  }
  catch (error) {
    vscode.window.showWarningMessage(`Failed to auto-compile Tailwind v4 CSS for file ${cssFilePath}: ${String(error)}`)
  }
}

function runResolver(
  resolver: EnhancedResolve.Resolver,
  id: string,
  base: string,
): Promise<string | false | undefined> {
  return new Promise((resolve, reject) =>
    resolver.resolve({}, base, id, {}, (err, result) => {
      if (err) {
        return reject(err)
      }
      resolve(result)
    }),
  )
}
