import path from 'node:path'
import * as vscode from 'vscode'
import { initTRPC } from '@trpc/server'
import { z } from 'zod'
import { workspaceCssFiles } from '../util/workspace-css-files'
import type { MyStorageType } from '../my-extension-storage'
import { frameIds } from './panel-command-handler'

export interface PanelRouterCtx {
  getUiTestSession: () => Promise<vscode.DebugSession | null>
  storage: MyStorageType
}

const t = initTRPC.context<PanelRouterCtx>().create()

/** Re-usable functions between different routes. */
const middleware = t.middleware(async ({ ctx, next }) => {
  async function runDebugExpression(expression: string) {
    const uiSession = await ctx.getUiTestSession()
    if (!uiSession) {
      throw new Error('Could not find UI test session')
    }

    const evalResult: EvalResult = await uiSession.customRequest(
      'evaluate',
      {
        expression,
        context: 'clipboard',
        frameId: frameIds.get(uiSession),
      },
    )

    const result = evalResult.result

    return result
  }

  return next({
    ctx: { ...ctx, runDebugExpression },
  })
})

const proc = t.procedure.use(middleware)

/** Defines routes callable from the WebView to the VSCode Extension. */
export const panelRouter = t.router({
  serializeHtml: proc
    .query(async ({ ctx }) => {
      const html = await ctx.runDebugExpression('globalThis.__serializeHtml()')
      return html
    }),

  availableCssFiles: proc
    .query(async ({ ctx }) => {
      const workspacePaths = await workspaceCssFiles()
      const externalPaths = await ctx.storage.get('externalCssFiles') ?? []
      const enabledFiles = await ctx.storage.get('enabledCssFiles') ?? []

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

  addExternalCssFiles: proc
    .mutation(async ({ ctx }) => {
      const selectedUris = await vscode.window.showOpenDialog({
        canSelectMany: true,
      })

      const newPaths = selectedUris?.map(it => it.path)

      if (newPaths?.length) {
        // Add the new files to the stored list of external files
        ctx.storage.set('externalCssFiles', old => [...(old ?? []), ...newPaths])

        // Enable the new files automatically
        ctx.storage.set('enabledCssFiles', old => [...(old ?? []), ...newPaths])
      }
    }),

  removeExternalCssFile: proc
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      const path = input
      ctx.storage.set('externalCssFiles', old => (old ?? []).filter(it => it !== path))
      ctx.storage.set('enabledCssFiles', old => (old ?? []).filter(it => it !== path))
    }),

  toggleCssFile: proc
    .input(
      z.object({
        path: z.string(),
        enabled: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { path, enabled } = input

      ctx.storage.set(
        'enabledCssFiles',
        old => enabled ? [...(old ?? []), path] : (old ?? []).filter(it => it !== path),
      )
    }),

  replaceStyles: proc
    .mutation(async ({ ctx }) => {
      const files = await ctx.storage.get('enabledCssFiles') ?? []
      const filesAsString = JSON.stringify(files)
      const result = await ctx.runDebugExpression(
        `globalThis.__replaceStyles(${filesAsString})`,
      )
      return !!result
    }),
})

export type PanelRouter = typeof panelRouter

export interface EvalResult {
  type: string
  result: string
}
