import path from "path";
import type { DebugConfiguration } from "vscode";

const cliInjectPath = path.resolve(
  __dirname,
  "cli-inject.js"
);

export const testVisualizer = {
  wrapDebugConfig(original: DebugConfiguration): DebugConfiguration {
    return {
      ...original,
      runtimeArgs: [
        ...(original.runtimeArgs ?? []),
        "--require",
        cliInjectPath,
      ],
      args: [
        ...(original.args ?? []),
        "--pool",
        "forks",
        "--poolOptions.forks.minForks",
        1,
        "--poolOptions.forks.maxForks",
        1,
      ],
    };
  },
};
