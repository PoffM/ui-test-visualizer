import path from "path";
import type { DebugConfiguration } from "vscode";
import * as vscode from "vscode";
import { createServer } from "http";
import getPort from "get-port";

const cliInjectPath = path.resolve(__dirname, "inject-cli.js");

export async function startVisualTestingBackEnd() {
  const htmlUpdaterPort = await getPort();
  const viteDevServerPort = 5173;

  // Create the webview panel
  const panel = vscode.window.createWebviewPanel(
    "visualTest",
    "Tested UI",
    vscode.ViewColumn.Beside,
    {
      enableScripts: true,
    }
  );

  // Listen for html updates from the test worker process
  const htmlUpdaterServer = createServer((req, res) => {
    if (req.method !== "POST") {
      res.writeHead(400);
      res.end(`${req.method} not supported`);
    }

    let newHtml = "";
    req.on("data", (chunk) => {
      newHtml += chunk.toString();
    });
    req.on("end", () => {
      panel.webview.postMessage({ newHtml })
      res.writeHead(200);
      res.end("HTML received");
    });
  }).listen(htmlUpdaterPort);

  // Load the html from the Vite app.
  // TODO get the static html file in production
  fetch(`http://localhost:${viteDevServerPort}/`)
    .then((res) => res.text())
    .then((html) => {
      panel.webview.html = html;
    })
    .catch((err) => {
      console.error(err);
    });

  return {
    /** Inject additional args into the vitest-explorer extension's debugger config. */
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
        env: {
          ...original.env,
          HTML_UPDATER_PORT: String(htmlUpdaterPort),
        },
      };
    },
    cleanupVisualTestingBackEnd() {
      htmlUpdaterServer.close();
      panel.dispose();
    },
  };
}
