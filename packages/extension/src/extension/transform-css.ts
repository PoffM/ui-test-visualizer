import fs from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import { findUp, findUpMultiple } from 'find-up'
import { globby } from 'globby'
import path from 'pathe'
import postcss from 'postcss'
import postcssrc from 'postcss-load-config'
import { preprocessCSS, resolveConfig } from 'vite'
import * as vscode from 'vscode'

// @ts-expect-error copied js file from old tailwind version
import { defaultExtractor } from './tailwind-extractor/defaultExtractor'

/**
 * Loads and processes a CSS file using
 * Vite's 'preprocessCSS' and 'transformRequest' funnctions.
 *
 * Should support:
 * - Preprocessors (less, sass, scss, styl, stylus)
 * - PostCSS (Tailwind, )
 * - Vite plugins using the user's vite.config.{ts,js} (Tailwind, )
 *
 * Replaces `:root` with `:root,:host` because the processed styles end up in the shadow DOM.
 */
export async function transformCss(cssFilePath: string) {
  const cwd = process.cwd()
  try {
    let code = await fs.readFile(cssFilePath, 'utf8')

    // Run preprocessors e.g. (less, sass, scss, styl, stylus) using Vite's auto-detection.
    // Use the user's CWD so Vite imports the user's preprocessor deps.
    process.chdir(path.dirname(cssFilePath))
    code = (await preprocessCSS(
      code,
      cssFilePath,
      await resolveConfig({
        css: {
          // Disable postcss. Oddly 'preprocessCSS' runs Postcss by default.
          postcss: {},
        },
        configFile: false,
      }, 'serve'),
    )).code

    // Get the user's PostCSS config
    process.chdir(path.dirname(cssFilePath))
    const postCssCfg = await (async () => {
      try {
        return await postcssrc()
      }
      catch (error) {
        if (error instanceof Error && error.message.startsWith('No PostCSS Config found')) {
          // Suppress this error because it's fine if there's no PostCSS config.
          return null
        }
        vscode.window.showWarningMessage(`Failed to parse PostCSS config found for file ${cssFilePath}: ${String(error)}`)
        return null
      }
    })()

    if (postCssCfg) {
      process.chdir(path.dirname(postCssCfg.file))
    }
    // Apply PostCSS plugins, e.g. for Tailwind v3
    code = (await postcss([
      ...(postCssCfg?.plugins ?? []),
      {
        postcssPlugin: 'replace-root',
        Rule(rule) {
          rule.selector = rule.selector.replace(/:root/, ':root,:host')
        },
      },
    ]).process(code, {
      ...postCssCfg?.options,
      from: cssFilePath,
      map: false,
    })).css

    // Handle Tailwind v4 as a special case.
    {
      const tailwindJs = (() => {
        try {
          return require.resolve('tailwindcss', { paths: [path.dirname(cssFilePath)] })
        }
        catch {
          return null
        }
      })()
      if (tailwindJs) {
        const packageJsonPath = await findUp('package.json', { cwd: path.dirname(tailwindJs) })
        if (packageJsonPath) {
          if (tailwindJs && getPackageVersion(packageJsonPath)?.startsWith('4.')) {
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

              const twCandidates = await (async () => {
                const searchPath = path.dirname(projectPkgJson ?? cssFilePath)
                const filesToScan = await globby(
                  ['**/*.{html,js,ts,jsx,tsx,svelte,vue}', '!**/node_modules/**/*'],
                  { cwd: searchPath },
                )
                const results: string[] = []
                for (const file of filesToScan) {
                  const filePath = path.join(searchPath, file)
                  const content = await fs.readFile(filePath, 'utf8')
                  const fileCandidates = defaultExtractor({ tailwindConfig: { separator: ':' } })(content)
                  results.push(...fileCandidates)
                }
                return results
              })()

              // eslint-disable-next-line ts/no-var-requires, ts/no-require-imports
              const { compile } = require(tailwindJs)
              code = (await compile(code, {
                base: path.dirname(cssFilePath),
                // eslint-disable-next-line unused-imports/no-unused-vars
                loadModule: async (id: string, base: string, resourceHint: 'plugin' | 'config') => {
                  const filePath = path.join(path.dirname(cssFilePath), id)
                  const url = pathToFileURL(filePath).href
                  const mod = await import(url)
                  return {
                    base,
                    module: mod,
                  }
                },
              })).build(twCandidates)
            }
            catch (error) {
              vscode.window.showWarningMessage(`Failed to auto-compile Tailwind v4 CSS for file ${cssFilePath}: ${String(error)}`)
            }
          }
        }
      }
    }

    return code
  }
  finally {
    process.chdir(cwd)
  }
}

function getPackageVersion(packageJsonPath: string): string | null {
  try {
    // eslint-disable-next-line ts/no-var-requires, ts/no-require-imports
    return require(packageJsonPath).version
  }
  catch (error) {
    return null
  }
}
