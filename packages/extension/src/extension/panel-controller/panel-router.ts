import path from 'node:path'
import * as vscode from 'vscode'
import { initTRPC } from '@trpc/server'
import { z } from 'zod'
import type { MyStorageType } from '../extension'
import { frameIds } from './panel-command-handler'

export interface PanelRouterCtx {
  getUiTestSession: () => Promise<vscode.DebugSession | null>
  storage: MyStorageType
}

const t = initTRPC.context<PanelRouterCtx>().create()

/** Defines routes callable from the WebView to the VSCode Extension. */
export const panelRouter = t.router({
  serializeHtml: t.procedure
    .query(async ({ ctx }) => {
      const uiSession = await ctx.getUiTestSession()
      if (!uiSession) {
        throw new Error('Could not find UI test session')
      }

      const evalResult: EvalResult = await uiSession.customRequest(
        'evaluate',
        {
          expression: 'globalThis.__serializeHtml()',
          context: 'clipboard',
          frameId: frameIds.get(uiSession),
        },
      )

      const html = evalResult.result

      return html
    }),

  availableCssFiles: t.procedure
    .query(async ({ ctx }) => {
      const workspaceFiles = await vscode.workspace.findFiles(
        '**/*.{less,sass,scss,styl,stylus}',
        '**/node_modules/**',
      )

      const workspacePaths = workspaceFiles.map(it => it.path)
      const externalPaths = ctx.storage.externalCssFiles ?? []

      const enabledFiles = ctx.storage.enabledCssFiles

      function getFileInfo(filePath: string, isExternal: boolean) {
        const displayPath = (() => {
          const roots = vscode.workspace.workspaceFolders?.map(it => it.uri.path)
          for (const root of roots ?? []) {
            if (filePath.startsWith(root)) {
              return path.relative(root, filePath)
            }
          }
          return filePath
        })()

        return {
          path: filePath,
          enabled: enabledFiles?.includes(filePath) ?? false,
          isExternal,
          displayPath,
        }
      }

      const fileInfos = [
        ...workspacePaths.map(path => getFileInfo(path, false)),
        ...externalPaths.map(path => getFileInfo(path, true)),
      ]

      return fileInfos
    }),

  addExternalCssFiles: t.procedure
    .mutation(async ({ ctx }) => {
      const selectedUris = await vscode.window.showOpenDialog({
        canSelectMany: true,
      })

      const newPaths = selectedUris?.map(it => it.path)

      if (newPaths?.length) {
        // Add the new files to the stored list of external files
        ctx.storage.externalCssFiles = [
          ...(ctx.storage.externalCssFiles ?? []),
          ...newPaths,
        ]

        // Enable the new files automatically
        ctx.storage.enabledCssFiles = [
          ...(ctx.storage.enabledCssFiles ?? []),
          ...newPaths,
        ]
      }
    }),

  toggleCssFile: t.procedure
    .input(
      z.object({
        path: z.string(),
        enabled: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { path, enabled } = input
      const oldEnabledFiles = ctx.storage.enabledCssFiles ?? []
      const newEnabledFiles = enabled
        ? [...oldEnabledFiles, path]
        : oldEnabledFiles.filter(it => it !== path)
      ctx.storage.enabledCssFiles = newEnabledFiles
    }),
})

export type PanelRouter = typeof panelRouter

export interface EvalResult {
  type: string
  result: string
}
