import { findUp } from "find-up";
import path from "path";
import { getJestBinPath } from "./jest-support";
import { getVitestBinPath } from "./vitest-support";
import { readInitialOptions } from "jest-config";

export interface TestFrameworkInfo {
  framework: "jest" | "vitest";
  configPath: string;
  binPath: string;
  setupFiles?: string[];
}

export async function detectTestFramework(
  testFilePath: string
): Promise<TestFrameworkInfo> {
  const vitestFile = await findUp(vitestConfigFiles, { cwd: testFilePath });
  const jestFile = await findUp(
    [
      "jest.config.js",
      "jest.config.ts",
      "jest.config.cjs",
      "jest.config.mjs",
      "jest.config.json",
    ],
    { cwd: testFilePath }
  );

  const setupFiles = await (async () => {
    if (jestFile) {
      const jestOptions = await readInitialOptions(jestFile);
      const setupFiles = jestOptions.config.setupFiles ?? [];
      return setupFiles;
    }
    return [];
  })();

  const configPath = vitestFile ?? jestFile;

  if (!configPath) {
    throw new Error("No Vitest or Jest config found");
  }

  const vitestCfgPathLength = vitestFile?.split(path.sep).length ?? 0;
  const jestConfigPathLength = jestFile?.split(path.sep).length ?? 0;

  if (jestConfigPathLength > vitestCfgPathLength) {
    return {
      framework: "jest" as const,
      configPath,
      setupFiles,
      binPath: await getJestBinPath(testFilePath),
    };
  } else {
    return {
      framework: "vitest" as const,
      configPath,
      binPath: await getVitestBinPath(testFilePath),
    };
  }
}

const CONFIG_NAMES = ["vitest.config", "vite.config"];

const CONFIG_EXTENSIONS = [".ts", ".mts", ".cts", ".js", ".mjs", ".cjs"];

export const vitestConfigFiles = CONFIG_NAMES.flatMap((name) =>
  CONFIG_EXTENSIONS.map((ext) => name + ext)
);
