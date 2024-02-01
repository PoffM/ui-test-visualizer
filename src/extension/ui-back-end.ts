import getPort from "get-port";
import { debounce } from "lodash";
import path from "path";
import * as vscode from "vscode";
import { RawData, Server } from "ws";
import { HTMLPatch } from "../dom-sync/types";

export async function startVisualTestingBackEnd() {
  const htmlUpdaterPort = await getPort();
  const viteDevServerPort = 5173;

  let panel: vscode.WebviewPanel | undefined;

  const updateWholeHtml = debounce((buffer: RawData) => {
    const newHtml = buffer.toString();
    panel?.webview.postMessage({ newHtml });
  }, 100);

  const isExperimentalFastMode = vscode.workspace
    .getConfiguration()
    .get("visual-ui-test-debugger.experimentalFastMode");

  // Listen for html updates from the test worker process
  const htmlUpdaterServer = new Server({ port: htmlUpdaterPort });
  htmlUpdaterServer.on("connection", function connection(socket) {
    socket.on("message", function incoming(buffer) {
      if (isExperimentalFastMode) {
        const htmlPatch: HTMLPatch = JSON.parse(buffer.toString());
        panel?.webview.postMessage({ htmlPatch });
      } else {
        updateWholeHtml(buffer);
      }
    });
  });

  return {
    htmlUpdaterPort,
    async openPanel() {
      // Create the webview panel
      panel = vscode.window.createWebviewPanel(
        "visualTest",
        "Tested UI",
        vscode.ViewColumn.Beside,
        {
          enableFindWidget: true,
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
