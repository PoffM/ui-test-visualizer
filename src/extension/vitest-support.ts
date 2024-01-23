import { findUp } from "find-up";
import path from "path";
import * as vscode from "vscode";

/** Extra debug config to pass into the VSCode debug process when using Vitest. */
export async function vitestDebugConfig(
  documentUri: vscode.Uri,
  config: vscode.DebugConfiguration
) {
  return {
    ...config,
    cwd: undefined,
    internalConsoleOptions: undefined,
    console: undefined,
    type: "pwa-node",
    program: await getVitestPath(documentUri.path),
    runtimeArgs: [
      ...(config.runtimeArgs ?? []),
      "--require",
      path.resolve(__dirname, "inject-cli.js"),
    ],
    args: [
      // The Vitest "run" command
      "run",
      // Remove the jest "--runInBand" arg
      ...config.args.filter((it: unknown) => it !== "--runInBand"),
      // Use child process instead of the default threads.
      "--pool",
      "forks",
      "--poolOptions.forks.minForks",
      1,
      "--poolOptions.forks.maxForks",
      1,
    ],
    autoAttachChildProcesses: true,
    // TODO use the config
    skipFiles: [
      "**/node_modules/**",
      "**/dist/**",
      "**/cypress/**",
      "**/.{idea,git,cache,output,temp}/**",
    ],
    smartStep: true,
  };
}

const CONFIG_NAMES = ["vitest.config", "vite.config"];

const CONFIG_EXTENSIONS = [".ts", ".mts", ".cts", ".js", ".mjs", ".cjs"];

export const vitestConfigFiles = CONFIG_NAMES.flatMap((name) =>
  CONFIG_EXTENSIONS.map((ext) => name + ext)
);

async function getVitestPath(filepath: string) {
  return (
    (await findUp("node_modules/vitest/vitest.mjs", { cwd: filepath })) ??
    (await findUp("node_modules/.bin/vitest.js", { cwd: filepath })) ??
    (await findUp("node_modules/.bin/vitest.cmd", { cwd: filepath }))
  );
}
