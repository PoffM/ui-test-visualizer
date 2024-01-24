import getPort from "get-port";
import { createServer } from "http";
import path from "path";
import * as vscode from "vscode";

export async function startVisualTestingBackEnd() {
  const htmlUpdaterPort = await getPort();
  const viteDevServerPort = 5173;

  let panel: vscode.WebviewPanel | undefined;

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
      panel?.webview.postMessage({ newHtml });
      res.writeHead(200);
      res.end("HTML received");
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
      const viteResponse = await fetch(`http://localhost:${viteDevServerPort}/`);
      const html = await viteResponse.text();
      panel.webview.html = html;
    },
    dispose() {
      htmlUpdaterServer.close();
      panel?.dispose();
    },
  };
}
