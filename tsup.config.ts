import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    extension: "./src/extension/extension.ts",
    "inject-cli": "./src/extension/inject-cli.ts",
    "inject-test": "./src/extension/inject-test.ts",
  },
  external: ["vscode", "vitest"],
  target: "esnext",
});
