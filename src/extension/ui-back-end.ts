import getPort from "get-port";
import { debounce } from "lodash";
import { createServer } from "net";
import path from "path";
import * as vscode from "vscode";

export async function startVisualTestingBackEnd() {
  const htmlUpdaterPort = await getPort();
  const viteDevServerPort = 5173;

  let panel: vscode.WebviewPanel | undefined;

  const updateHtml = debounce((newHtml: string) => {
    panel?.webview.postMessage({ newHtml });
  }, 100);

  // Listen for html updates from the test worker process
  const htmlUpdaterServer = createServer((socket) => {
    socket.on("data", (buffer) => {
      const newHtml = buffer.toString();
      updateHtml(newHtml);
    });
  }).listen(htmlUpdaterPort);

  return {
    htmlUpdaterPort,
    async openPanel() {
      // Create the webview panel
      panel = vscode.window.createWebviewPanel(
        "visualTest",
        "Tested UI",
        vscode.ViewColumn.Beside,
        {
          enableScripts: true,
        }
      );

      // TODO use the right icon in production
      panel.iconPath = vscode.Uri.file(path.resolve(__dirname, "./debug.svg"));

      // Load the html from the Vite app.
      // TODO get the static html file in production
      const viteResponse = await fetch(
        `http://localhost:${viteDevServerPort}/`
      );
      const html = await viteResponse.text();
      panel.webview.html = html;
    },
    dispose() {
      htmlUpdaterServer.close();
      panel?.dispose();
    },
  };
}
