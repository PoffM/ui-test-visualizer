import fs from 'node:fs/promises'
import postcss from 'postcss'
import postcssrc from 'postcss-load-config'
import { runAsWorker } from 'synckit'
import { createServer, preprocessCSS, resolveConfig } from 'vite'
import { findUpSync } from 'find-up'

runAsWorker(loadStyles)

/**
 * Loads and processes a CSS file.
 * Supports preprocessors (less, sass, scss, styl, stylus)
 * and PostCSS (Tailwind, ).
 * Replaces `:root` with `:root,:host` because the processed styles end up in the shadow DOM.
 */
async function loadStyles(cssFilePath: string) {
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
    const viteCfgPath = findUpSync(['vite.config.ts', 'vite.config.js'], { cwd: cssFilePath })
    if (viteCfgPath) {
      try {
        const server = await createServer({ configFile: viteCfgPath })
        const result = await server.transformRequest(`${cssFilePath}?direct`)
        return result.code
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
