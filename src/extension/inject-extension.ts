import path from "path";
import type { DebugConfiguration } from "vscode";
import * as vscode from "vscode";

const cliInjectPath = path.resolve(__dirname, "inject-cli.js");

/** Inject additional args into the vitest-explorer extension's debugger config. */
export function wrapDebugConfig(
  original: DebugConfiguration
): DebugConfiguration {
  const port = 5173;

  const panel = vscode.window.createWebviewPanel(
    "visualTest",
    "Tested UI",
    vscode.ViewColumn.Beside,
    {
      enableScripts: true,
    }
  );

  // Load the html from the Vite app.
  // TODO get the static html file in production
  fetch(`http://localhost:${port}/`)
    .then((res) => res.text())
    .then((html) => {
      panel.webview.html = html;
    })
    .catch((err) => {
      console.error(err);
    });

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
