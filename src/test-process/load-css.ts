import fs from "fs/promises";
import postcss from "postcss";
import postcssrc from "postcss-load-config";

export async function loadCss(file: string) {
  const css = await fs.readFile(file, "utf8");

  const cfg = await (async () => {
    try {
      return await postcssrc();
    } catch {
      return null;
    }
  })();

  const result = await postcss([
    ...(cfg?.plugins ?? []),
    {
      postcssPlugin: "replace-root",
      Rule(rule) {
        rule.selector = rule.selector.replace(/:root/, ":root,:host");
      },
    },
  ]).process(css, {
    map: false,
  });

  return result.css;
}
