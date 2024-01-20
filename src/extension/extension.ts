import * as vscode from "vscode";
import {
  detectVitestEnvironmentFolders,
  vitestEnvironmentFolders,
} from "../../node_modules/vitest-explorer/src/config";
import { JestRunnerCodeLensProvider } from "../../node_modules/vscode-jest-runner/src/JestRunnerCodeLensProvider";
import { JestRunner } from "../../node_modules/vscode-jest-runner/src/jestRunner";
import { JestRunnerConfig } from "../../node_modules/vscode-jest-runner/src/jestRunnerConfig";
import { prepareJestRunnerForVitest } from "./vitest-support";

export async function activate(context: vscode.ExtensionContext) {
  const config = new JestRunnerConfig();
  const jestRunner = new JestRunner(config);
  const codeLensProvider = new JestRunnerCodeLensProvider(
    config.codeLensOptions
  );

  await detectVitestEnvironmentFolders();
  const hasVitestConfig = !!vitestEnvironmentFolders.length;
  if (hasVitestConfig) {
    prepareJestRunnerForVitest(jestRunner);
  }

  const debugTest = vscode.commands.registerCommand(
    "extension.debugJest",
    async (argument: Record<string, unknown> | string) => {
      if (typeof argument === "string") {
        return jestRunner.debugCurrentTest(argument);
      } else {
        return jestRunner.debugCurrentTest();
      }
    }
  );
  const debugTestPath = vscode.commands.registerCommand(
    "extension.debugJestPath",
    async (argument: vscode.Uri) => jestRunner.debugTestsOnPath(argument.path)
  );

  if (!config.isCodeLensDisabled) {
    const docSelectors: vscode.DocumentFilter[] = [
      {
        pattern: vscode.workspace
          .getConfiguration()
          .get("jestrunner.codeLensSelector"),
      },
    ];
    const codeLensProviderDisposable =
      vscode.languages.registerCodeLensProvider(docSelectors, codeLensProvider);
    context.subscriptions.push(codeLensProviderDisposable);
  }

  context.subscriptions.push(debugTest);
  context.subscriptions.push(debugTestPath);
}

export function deactivate() {}
