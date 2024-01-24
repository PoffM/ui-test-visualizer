import * as vscode from "vscode";
import { detectTestFramework } from "../framework-support/detect";
import { jestDebugConfig } from "../framework-support/jest-support";
import { vitestDebugConfig } from "../framework-support/vitest-support";
import { codeLensProvider } from "./code-lens-provider";
import { startVisualTestingBackEnd } from "./ui-back-end";

export async function activate(context: vscode.ExtensionContext) {
  const debugTest = vscode.commands.registerCommand(
    "visual-ui-test-debugger.debugJest",
    async (testName: unknown) => {
      if (typeof testName !== "string") {
        throw new Error("Expected a string argument");
      }

      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        return;
      }

      await editor.document.save();

      const backEnd = await startVisualTestingBackEnd();

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
            dispose2.dispose();
            newDispose.dispose();
          }
        }, 200);
        backEnd.dispose();
      });

      const filePath = editor.document.fileName;

      const fwInfo = await detectTestFramework(filePath);

      const debugConfig: vscode.DebugConfiguration =
        fwInfo.framework === "jest"
          ? await jestDebugConfig(filePath, testName)
          : await vitestDebugConfig(filePath, testName);

      debugConfig.env = {
        ...debugConfig.env,
        TEST_FRAMEWORK: fwInfo.framework,
        TEST_FILE_PATH: filePath,
        HTML_UPDATER_PORT: String(backEnd.htmlUpdaterPort),
      };

      vscode.debug.startDebugging(undefined, debugConfig);
    }
  );

  if (
    !vscode.workspace
      .getConfiguration()
      .get("visual-ui-test-debugger.disableCodeLens")
  ) {
    const docSelectors: vscode.DocumentFilter[] = [
      {
        pattern: vscode.workspace
          .getConfiguration()
          .get("visual-ui-test-debugger.codeLensSelector"),
      },
    ];
    context.subscriptions.push(
      vscode.languages.registerCodeLensProvider(docSelectors, codeLensProvider)
    );
  }

  context.subscriptions.push(debugTest);
}

export function deactivate() {}
