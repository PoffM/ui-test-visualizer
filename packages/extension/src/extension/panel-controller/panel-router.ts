import path from 'node:path'
import * as vscode from 'vscode'
import { initTRPC } from '@trpc/server'
import { z } from 'zod'
import { workspaceCssFiles } from '../util/workspace-css-files'
import type { MyStorageType } from '../my-extension-storage'
import type { DebugSessionTracker } from '../util/debug-session-tracker'

export interface PanelRouterCtx {
  sessionTracker: DebugSessionTracker
  storage: MyStorageType
}

const t = initTRPC.context<PanelRouterCtx>().create()

/** Defines routes callable from the WebView to the VSCode Extension. */
export const panelRouter = t.router({
  serializeHtml: t.procedure
    .query(async ({ ctx }) => {
      const html = await ctx.sessionTracker.runDebugExpression('globalThis.__serializeHtml()')
      return html
    }),

  availableCssFiles: t.procedure
    .query(async ({ ctx }) => {
      const workspacePaths = await workspaceCssFiles()
      const externalPaths = await ctx.storage.get('externalCssFiles') ?? []
      const enabledFiles = await ctx.storage.get('enabledCssFiles') ?? []

      function getFileInfo(filePath: string, isExternal: boolean) {
        const displayPath = (() => {
          const roots = vscode.workspace.workspaceFolders?.map(it => it.uri.fsPath)
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

      const newPaths = selectedUris?.map(it => it.fsPath)

      if (newPaths?.length) {
        // Add the new files to the stored list of external files
        ctx.storage.set('externalCssFiles', old => [...(old ?? []), ...newPaths])

        // Enable the new files automatically
        ctx.storage.set('enabledCssFiles', old => [...(old ?? []), ...newPaths])
      }
    }),

  removeExternalCssFile: t.procedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      const path = input
      ctx.storage.set('externalCssFiles', old => (old ?? []).filter(it => it !== path))
      ctx.storage.set('enabledCssFiles', old => (old ?? []).filter(it => it !== path))
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

      ctx.storage.set(
        'enabledCssFiles',
        old => enabled ? [...(old ?? []), path] : (old ?? []).filter(it => it !== path),
      )
    }),

  replaceStyles: t.procedure
    .mutation(async ({ ctx }) => {
      const files = await ctx.storage.get('enabledCssFiles') ?? []
      const filesAsString = JSON.stringify(files)
      const result = await ctx.sessionTracker.runDebugExpression(
        `globalThis.__replaceStyles(${filesAsString})`,
      )
      return !!result
    }),

  /** Whether to show the one-time message asking you to enable styles. */
  showStylePrompt: t.procedure
    .query(async ({ ctx }) => {
      const dismissed = await ctx.storage.get('stylePromptDismissed') ?? false

      if (dismissed) {
        return false
      }

      const enabledFiles = await ctx.storage.get('enabledCssFiles') ?? []
      if (enabledFiles.length) {
        return false
      }

      const cssFiles = await workspaceCssFiles()
      const hasWorkspaceCssFiles = cssFiles.length > 0

      return hasWorkspaceCssFiles
    }),

  dismissStylePrompt: t.procedure
    .mutation(async ({ ctx }) => {
      ctx.storage.set('stylePromptDismissed', true)
    }),

  unDismissStylePrompt: t.procedure
    .mutation(async ({ ctx }) => {
      ctx.storage.set('stylePromptDismissed', false)
    }),
})

export type PanelRouter = typeof panelRouter
