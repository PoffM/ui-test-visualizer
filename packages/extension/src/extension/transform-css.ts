import fs from 'node:fs/promises'
import postcss from 'postcss'
import postcssrc from 'postcss-load-config'
import { createServer, preprocessCSS, resolveConfig } from 'vite'
import { findUp } from 'find-up'
import path from 'pathe'

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
  const sourceCode = await fs.readFile(cssFilePath, 'utf8')

  /** The parsed PostCSS config. */
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

  const css = await (async () => {
    // First: Try to transform the CSS file using the user's Vite config.
    const viteCfgPath = await findUp(['vite.config.ts', 'vite.config.js'], { cwd: cssFilePath })
    if (viteCfgPath) {
      try {
        const server = await createServer({
          configFile: viteCfgPath,
          root: path.dirname(viteCfgPath),
        })
        const url = `${cssFilePath}?direct`
        const result = await server.transformRequest(url)
        if (result === null) {
          console.warn(`Vite returned null when transforming CSS url ${url}.`)
          console.warn(`Falling back to Vite's 'preprocessCSS' function without user's Vite config.`)
        }
        else {
          return result.code
        }
      }
      catch (error) {
        console.warn(`Failed to transform CSS file ${cssFilePath} using Vite config file ${viteCfgPath}`, error)
      }
    }

    // Fallback: Try to transform the CSS file using Vite's 'preprocessCSS' function.
    const preprocessResult = await preprocessCSS(
      sourceCode,
      cssFilePath,
      await resolveConfig({ configFile: false }, 'serve'),
    )
    return preprocessResult.code
  })()

  const result = await postcss([
    ...(postCssCfg?.plugins ?? []),
    {
      postcssPlugin: 'replace-root',
      Rule(rule) {
        rule.selector = rule.selector.replace(/:root/, ':root,:host')
      },
    },
  ]).process(css, {
    ...postCssCfg?.options,
    from: cssFilePath,
    map: false,
  })

  return result.css
}
