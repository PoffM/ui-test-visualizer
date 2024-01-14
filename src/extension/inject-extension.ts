import path from "path";
import type { DebugConfiguration } from "vscode";

const cliInjectPath = path.resolve(__dirname, "inject-cli.js");

/** Inject additional args into the vitest-explorer extension's debugger config. */
export function wrapDebugConfig(
  original: DebugConfiguration
): DebugConfiguration {
  return {
    ...original,
    runtimeArgs: [...(original.runtimeArgs ?? []), "--require", cliInjectPath],
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
}
