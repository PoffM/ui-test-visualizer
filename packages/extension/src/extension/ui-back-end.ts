import getPort from "get-port";
import { debounce } from "lodash";
import path from "path";
import * as vscode from "vscode";
import { RawData, Server } from "ws";
import { HTMLPatch } from "../../../replicate-dom";

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

  await new Promise((res) => {
    htmlUpdaterServer.on("listening", res);
  });

  return {
    htmlUpdaterPort,
    async openPanel(extensionContext: vscode.ExtensionContext) {
      // Create the webview panel
      panel = vscode.window.createWebviewPanel(
        "visualTest",
        "Tested UI",
        vscode.ViewColumn.Beside,
        {
          enableFindWidget: true,
          enableScripts: true,
          retainContextWhenHidden: true,
        }
      );

      panel.iconPath = vscode.Uri.file(path.resolve(__dirname, "./debug.svg"));

      const html = await (async () => {
        // In dev mode, load the html from the live Vite app.
        if (process.env.NODE_ENV === "development") {
          const viteResponse = await fetch(
            `http://localhost:${viteDevServerPort}/`
          );
          const devHtml = await viteResponse.text();
          return devHtml;
        }

        // In production, load the built static front-end files.
        if (process.env.NODE_ENV === "production") {
          function getUri(path: string) {
            return panel?.webview.asWebviewUri(
              vscode.Uri.joinPath(extensionContext.extensionUri, path)
            );
          }

          const appCss = getUri(
            "packages/extension/dist/web-view-vite/assets/index.css"
          );
          const appJs = getUri(
            "packages/extension/dist/web-view-vite/assets/index.js"
          );
          const icon = getUri("packages/extension/dist/debug.svg");

          const prodHtml = `
            <!doctype html>
            <html lang="en">
              <head>
                <link rel="icon" type="image/svg+xml" href="${icon}" />
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                <script type="module" crossorigin src="${appJs}"></script>
                <link rel="stylesheet" crossorigin href="${appCss}">
              </head>
              <body>
                <div id="root"></div>
              </body>
            </html>`;

          return prodHtml;
        }

        throw new Error("Unknown NODE_ENV");
      })();

      panel.webview.html = html;
    },
    dispose() {
      htmlUpdaterServer.close();
      panel?.dispose();
    },
  };
}
