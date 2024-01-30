import * as vscode from "vscode";
import { detectTestFramework } from "./framework-support/detect";
import { jestDebugConfig } from "./framework-support/jest-support";
import { vitestDebugConfig } from "./framework-support/vitest-support";
import { codeLensProvider } from "./code-lens-provider";
import { startVisualTestingBackEnd } from "./ui-back-end";

export async function activate(context: vscode.ExtensionContext) {
  const debugTest = vscode.commands.registerCommand(
    "visual-ui-test-debugger.visuallyDebugUI",
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

      const dispose1 = vscode.debug.onDidStartDebugSession(() => {
        backEnd.openPanel();
        dispose1.dispose();

        const dispose2 = vscode.debug.onDidTerminateDebugSession(() => {
          backEnd.dispose();
          dispose2.dispose();
        });
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
        EXPERIMENTAL_FAST_MODE: String(
          vscode.workspace
            .getConfiguration()
            .get("visual-ui-test-debugger.experimentalFastMode")
        ),
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
