import fs from "fs";
import path from "path";
import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    extension: "./src/extension/extension.ts",
    "inject-cli": "./src/extension/inject-cli.ts",
    "inject-test": "./src/extension/inject-test.ts",
  },
  external: ["vscode", "vitest"],
  noExternal: ["get-port"],
  target: "esnext",

  plugins: [
    {
      // TODO simpler way to make an svg green
      name: "prepare-green-icon",
      buildStart() {
        console.log("Preparing green debug icon");
        const src = path.resolve(
          __dirname,
          "./node_modules/@vscode/codicons/src/icons/debug.svg"
        );
        const dest = path.resolve(__dirname, "./dist/debug.svg");

        // Only generate if the source is newer than the destination
        {
          const srcTimestamp = fs.statSync(src).mtimeMs;
          const destTimestamp = fs.existsSync(dest)
            ? fs.statSync(dest).mtimeMs
            : 0;

          if (destTimestamp >= srcTimestamp) {
            return;
          }
        }

        const color = "#89D185";
        const newSvg = fs.readFileSync(src, "utf-8").replace(
          'fill="currentColor"',
          `fill="${color}"`
        );
        fs.writeFileSync(dest, newSvg);
        console.log("Green debug icon prepared");
      },
    },
  ],
});
