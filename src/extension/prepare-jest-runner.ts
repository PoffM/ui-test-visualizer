import * as vscode from "vscode";
import type { JestRunner } from "../../node_modules/vscode-jest-runner/src/jestRunner";
import { startVisualTestingBackEnd } from "./ui-back-end";

export type JestRunnerDebugConfigFn = (
  documentUri: vscode.Uri,
  config: vscode.DebugConfiguration
) => Promise<vscode.DebugConfiguration>;

export function prepareJestRunner(
  jestRunner: JestRunner,
  debugConfig: JestRunnerDebugConfigFn
) {
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

    config = await debugConfig(documentUri, {
      ...config,
      env: {
        // ...process.env,
        ...config.env,
        TEST_FILE_PATH: documentUri.fsPath,
        HTML_UPDATER_PORT: String(backEnd.htmlUpdaterPort),
      },
    });

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
