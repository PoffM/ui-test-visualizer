import path from "path";
import * as vscode from "vscode";
import { getVitestPath } from "../../node_modules/vitest-explorer/src/pure/utils";
import { JestRunner } from "../../node_modules/vscode-jest-runner/src/jestRunner";
import { projectRoot } from "./import-utils";
import { startVisualTestingBackEnd } from "./ui-back-end";

export function prepareJestRunnerForVitest(jestRunner: JestRunner) {
  const originalExecuteDebugCommand =
    // @ts-expect-error
    jestRunner.executeDebugCommand.bind(jestRunner);
  // @ts-expect-error
  jestRunner.executeDebugCommand = async ({
    config,
    documentUri,
  }: {
    documentUri: vscode.Uri;
    config: vscode.DebugConfiguration;
  }): Promise<void> => {
    const backEnd = await startVisualTestingBackEnd();

    config = {
      ...config,
      cwd: undefined,
      internalConsoleOptions: undefined,
      console: undefined,
      type: "pwa-node",
      program: getVitestPath(projectRoot(documentUri.path)),
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
      env: {
        ...process.env,
        ...config.env,
        HTML_UPDATER_PORT: String(backEnd.htmlUpdaterPort),
      },
    };

    let thisSession: vscode.DebugSession | undefined;
    const dispose1 = vscode.debug.onDidStartDebugSession((session) => {
      backEnd.openPanel();

      thisSession = session;
      dispose1.dispose();
    });
    const dispose2 = vscode.debug.onDidTerminateDebugSession((session) => {
      if (thisSession !== session) return;

      let timeout = false;
      let restarted = false;
      const newDispose = vscode.debug.onDidStartDebugSession((session) => {
        newDispose.dispose();
        if (timeout) return;

        restarted = true;
        thisSession = session;
      });

      setTimeout(() => {
        if (!restarted) {
          timeout = true;
          // onFinished()
          dispose2.dispose();
          newDispose.dispose();
        }
      }, 200);
      backEnd.cleanupVisualTestingBackEnd();
    });

    await originalExecuteDebugCommand({ config, documentUri });
  };
}
