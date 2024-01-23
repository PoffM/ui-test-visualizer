import { findUp } from "find-up";
import path from "path";
import * as vscode from "vscode";
import { JestRunnerCodeLensProvider } from "../../node_modules/vscode-jest-runner/src/JestRunnerCodeLensProvider";
import { JestRunner } from "../../node_modules/vscode-jest-runner/src/jestRunner";
import { JestRunnerConfig } from "../../node_modules/vscode-jest-runner/src/jestRunnerConfig";
import { prepareJestRunner } from "./prepare-jest-runner";
import { vitestConfigFiles, vitestDebugConfig } from "./vitest-support";

export async function activate(context: vscode.ExtensionContext) {
  const jestRunnerConfig = new JestRunnerConfig();
  const jestRunner = new JestRunner(jestRunnerConfig);
  const codeLensProvider = new JestRunnerCodeLensProvider(
    jestRunnerConfig.codeLensOptions
  );

  async function getTestFrameworkConfigInfo(testFilePath: string) {
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

    if (!vitestFile && !jestFile) {
      throw new Error("No Vitest or Jest config found");
    }

    const vitestCfgPathLength = vitestFile?.split(path.sep).length ?? 0;
    const jestConfigPathLength = jestFile?.split(path.sep).length ?? 0;

    if (jestConfigPathLength > vitestCfgPathLength) {
      return { framework: "jest" as const, configPath: jestFile };
    } else {
      return { framework: "vitest" as const, configPath: vitestFile };
    }
  }

  prepareJestRunner(jestRunner, async (documentUri, config) => {
    const fwInfo = await getTestFrameworkConfigInfo(documentUri.path);

    const updatedConfig = {
      ...config,

      ...(fwInfo.framework === "vitest" &&
        (await vitestDebugConfig(documentUri, config))),

      ...(fwInfo.framework === "jest" && {
        args: [
          ...(config.args ?? []),
          "--setupFiles",
          path.resolve(__dirname, "inject-test.js"),
        ],
      }),

      env: {
        ...config.env,
        TEST_FILE: documentUri.fsPath,
        TEST_FRAMEWORK: fwInfo.framework,
      },
    };

    return updatedConfig;
  });

  const debugTest = vscode.commands.registerCommand(
    "visual-ui-test-debugger.debugJest",
    async (argument: Record<string, unknown> | string) => {
      if (typeof argument === "string") {
        return jestRunner.debugCurrentTest(argument);
      } else {
        return jestRunner.debugCurrentTest();
      }
    }
  );
  const debugTestPath = vscode.commands.registerCommand(
    "visual-ui-test-debugger.debugJestPath",
    async (argument: vscode.Uri) => jestRunner.debugTestsOnPath(argument.path)
  );

  if (!jestRunnerConfig.isCodeLensDisabled) {
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
