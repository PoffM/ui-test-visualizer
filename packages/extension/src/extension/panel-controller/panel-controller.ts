import path from 'pathe'
import getPort from 'get-port'
import * as vscode from 'vscode'
import type { Server as WsServer } from 'ws'
import type { HTMLPatch } from 'replicate-dom'
import { callProcedure } from '@trpc/server'
import type { MyStorageType } from '../my-extension-storage'
import type { DebugSessionTracker } from '../util/debug-session-tracker'
import { type PanelRouterCtx, panelRouter } from './panel-router'

// Avoids import errors when importing in Vitest
// eslint-disable-next-line ts/no-var-requires, ts/no-require-imports
const Server = require('../../../node_modules/ws/lib/websocket-server') as typeof WsServer

export async function startPanelController(
  extensionContext: vscode.ExtensionContext,
  storage: MyStorageType,
) {
  const htmlUpdaterPort = await getPort()
  const viteDevServerPort = 5173

  let panel: vscode.WebviewPanel | undefined
  let onPanelMessage: vscode.Disposable | undefined

  // Listen for html updates from the test worker process
  const htmlUpdaterServer = new Server({ port: htmlUpdaterPort })
  htmlUpdaterServer.on('connection', (socket) => {
    socket.on('message', (buffer) => {
      // @ts-expect-error The message comes from the test process so allow it without validation
      const htmlPatch: HTMLPatch = JSON.parse(buffer.toString())
      panel?.webview.postMessage({ htmlPatch })
    })
  })

  await new Promise((res) => {
    htmlUpdaterServer.on('listening', res)
  })

  return {
    htmlUpdaterPort,
    async openPanel(
      sessionTracker: DebugSessionTracker,
    ) {
      // Create the webview panel
      panel = vscode.window.createWebviewPanel(
        'visualTest',
        'Tested UI',
        vscode.ViewColumn.Beside,
        {
          enableFindWidget: true,
          enableScripts: true,
          retainContextWhenHidden: true,
        },
      )

      panel.iconPath = vscode.Uri.file(path.resolve(__dirname, './debug.svg'))

      const html = await (async () => {
        // In dev mode, load the html from the live Vite app.
        if (process.env.NODE_ENV === 'development') {
          const localhost = process.platform === 'win32' ? '[::1]' : 'localhost'

          const viteResponse = await fetch(
            `http://${localhost}:${viteDevServerPort}/`,
          )
          const devHtml = await viteResponse.text()
          return devHtml
        }

        // In production, load the built static front-end files.
        if (
          process.env.NODE_ENV === 'test'
          || process.env.NODE_ENV === 'production'
        ) {
          function getUri(path: string) {
            return panel?.webview.asWebviewUri(
              vscode.Uri.joinPath(extensionContext.extensionUri, path),
            )
          }

          const appCss = getUri('web-view-vite/assets/index.css')
          const appJs = getUri('web-view-vite/assets/index.js')
          const icon = getUri('debug.svg')

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
            </html>`

          return prodHtml
        }

        throw new Error('Unknown NODE_ENV')
      })()

      panel.webview.html = html

      onPanelMessage = panel.webview.onDidReceiveMessage(async (e) => {
        const { path, input, type, id } = e

        try {
          const ctx: PanelRouterCtx = {
            sessionTracker,
            storage,
          }
          const result = await callProcedure({
            procedures: panelRouter._def.procedures,
            ctx,
            path,
            rawInput: input,
            input,
            type,
          })

          panel?.webview.postMessage({ id, data: result })
        }
        catch (error) {
          console.error(error)
          panel?.webview.postMessage({
            id,
            error: error instanceof Error ? error.message : null,
          })
        }
      })

      return { panel }
    },
    dispose() {
      htmlUpdaterServer.close()
      panel?.dispose()
      onPanelMessage?.dispose()
    },
  }
}
