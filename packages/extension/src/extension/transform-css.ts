import fs from 'node:fs/promises'
import postcss from 'postcss'
import postcssrc from 'postcss-load-config'
import { preprocessCSS, resolveConfig } from 'vite'
import path from 'pathe'
import { findUp } from 'find-up'
import { execa } from 'execa'

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

    // Run preprocessors e.g. (less, sass, scss, styl, stylus) using Vite's auto-detection
    code = (await preprocessCSS(
      code,
      cssFilePath,
      await resolveConfig({ configFile: false }, 'serve'),
    )).code

    /** The parsed PostCSS config. */
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
        console.warn(`Failed to parse PostCSS config found for file ${cssFilePath}`, error)
        return null
      }
    })()

    if (postCssCfg) {
      process.chdir(path.dirname(postCssCfg.file))
    }
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

    // Handle Tailwind v4 or up as a special case.
    // const tailwindPath = (() => {
    //   try {
    //     return require.resolve('tailwindcss', { paths: [path.dirname(cssFilePath)] })
    //   }
    //   catch {
    //     return null
    //   }
    // })()
    // if (tailwindPath && getPackageVersion(tailwindPath)?.startsWith('4.')) {
    //   // eslint-disable-next-line ts/no-var-requires, ts/no-require-imports
    //   const { compile } = require(tailwindPath)
    //   const out = (await compile(code, {
    //     base: path.dirname(cssFilePath),
    //     loadModule: (id, ...args) => {
    //       const resolved = require.resolve(id, { paths: [cssFilePath] })
    //       // eslint-disable-next-line ts/no-require-imports
    //       return require(resolved)
    //     },
    //   })).build([])
    //   console.log(out)
    // }

    return code
  }
  finally {
    process.chdir(cwd)
  }
}

function getPackageVersion(packageName: string): string | null {
  try {
    // eslint-disable-next-line ts/no-var-requires, ts/no-require-imports
    return require(`${packageName}/package.json`).version
  }
  catch (error) {
    return null
  }
}
