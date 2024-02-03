import fs from "fs/promises";
import postcss from "postcss";
import postcssrc from "postcss-load-config";
import { preprocessCSS, resolveConfig } from "vite";

/**
 * Loads and processes a CSS file.
 * Supports preprocessors (less, sass, scss, styl, stylus)
 * and PostCSS (Tailwind, ).
 * Replaces `:root` with `:root,:host` because the processed styles end up in the shadow DOM.
 */
export async function loadStyles(filePath: string) {
  const sourceCode = await fs.readFile(filePath, "utf8");

  /** The parsed PostCSS config. */
  const postCssCfg = await (async () => {
    try {
      return await postcssrc();
    } catch (error) {
      return null;
    }
  })();

  const preprocessResult = await preprocessCSS(
    sourceCode,
    filePath,
    await resolveConfig({}, "serve")
  );

  const css = preprocessResult.code;

  const result = await postcss([
    ...(postCssCfg?.plugins ?? []),
    {
      postcssPlugin: "replace-root",
      Rule(rule) {
        rule.selector = rule.selector.replace(/:root/, ":root,:host");
      },
    },
  ]).process(css, {
    ...postCssCfg?.options,
    from: filePath,
    map: false,
  });

  return result.css;
}
