import { findUp } from "find-up";
import path from "path";
import * as vscode from "vscode";
import { detectTestFramework } from "./detect";
import { cleanTestNameForTerminal } from "./util";

export async function jestDebugConfig(
  filePath: string,
  testName: string
): Promise<vscode.DebugConfiguration> {
  const fw = await detectTestFramework(filePath);

  return {
    console: "integratedTerminal",
    internalConsoleOptions: "neverOpen",
    name: "Visually Debug UI",
    program: fw.binPath,
    request: "launch",
    type: "pwa-node",
    args: [
      filePath,
      "-c",
      fw.configPath,
      "-t",
      cleanTestNameForTerminal(testName),
      "--runInBand",
      "--testTimeout=1000000000",
      "--setupFiles",
      path.resolve(__dirname, "inject-test.js"),
    ],
  };
}

const lookupPaths = ["node_modules/jest/bin/jest.js", "node_modules/.bin/jest"];

export async function getJestBinPath(filepath: string) {
  let jestPath: string | undefined;
  for (const lookupPath of lookupPaths) {
    jestPath = await findUp(lookupPath, { cwd: filepath });
    if (jestPath) {
      return jestPath;
    }
  }

  throw new Error(`Could not find Jest bin file in ${lookupPaths}`);
}
