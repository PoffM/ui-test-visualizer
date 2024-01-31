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

  if (!cfg) {
    return css;
  }

  const result = await postcss(cfg.plugins).process(css, {
    map: false,
  });

  return result.css;
}
