import { initTRPC } from '@trpc/server'
import path from 'pathe'
import * as vscode from 'vscode'
import { z } from 'zod/mini'
import type { MyStorageType } from '../my-extension-storage'
import { type RecorderCodeGenSession, zSerializedRegexp } from '../recorder/record-input-as-code'
import type { DebuggerTracker } from '../util/debugger-tracker'
import { workspaceCssFiles } from '../util/workspace-css-files'

export interface PanelRouterCtx {
  debuggerTracker: DebuggerTracker
  storage: MyStorageType
  flushPatches: () => void
  recorderCodeGenSession: () => RecorderCodeGenSession | null
}

const t = initTRPC.context<PanelRouterCtx>().create()

export const zRecordedEventData = z.object({
  text: z.optional(z.string()), // Used for change events
})

/** Defines RPCs callable from the WebView to the VSCode Extension. */
export const panelRouter = t.router({
  serializeHtml: t.procedure
    .query(async ({ ctx }) => {
      const html = await ctx.debuggerTracker.runDebugExpression('globalThis.__serializeHtml()')
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

  disableAllCssFiles: t.procedure
    .mutation(async ({ ctx }) => {
      ctx.storage.set('enabledCssFiles', [])
    }),

  replaceStyles: t.procedure
    .mutation(async ({ ctx }) => {
      const files = await ctx.storage.get('enabledCssFiles') ?? []
      const filesAsString = JSON.stringify(files)
      const resultStr = await ctx.debuggerTracker.runDebugExpression(
        `globalThis.__replaceStyles(${filesAsString})`,
      )
      ctx.flushPatches()

      const parsedResult = z.object({
        added: z.array(z.string()),
        removed: z.array(z.string()),
      }).safeParse(JSON.parse(JSON.parse(resultStr) as string))

      if (!parsedResult.success) {
        const message = `Internal error: Invalid result from __replaceStyles: ${resultStr}`
        vscode.window.showErrorMessage(message)
        return {
          type: 'error',
          message,
        } as const
      }

      const response = {
        type: 'success',
        ...parsedResult.data,
      } as const

      return response
    }),

  /** Transform the CSS file, given the filename, using Vite. */
  loadTransformedCss: t.procedure
    .input(z.string())
    .query(async ({ input }) => {
      const cssFilePath = input

      // eslint-disable-next-line ts/no-var-requires, ts/no-require-imports
      const { transformCss } = require('./transform-css')
      const transformedCss = await transformCss(cssFilePath)
      return transformedCss
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

  recordInputAsCode: t.procedure
    .input(
      z.object({
        event: z.string(),
        eventData: zRecordedEventData,
        query: z.tuple([
          z.string(),
          z.tuple([
            z.union([z.string(), zSerializedRegexp]),
            z.optional(z.record(
              z.string(),
              z.union([z.string(), z.boolean(), zSerializedRegexp]),
            )),
          ]),
        ]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { event, eventData, query: [method, [queryArg0, queryOptions]] } = input
      const recorderCodeGenSession = ctx.recorderCodeGenSession()
      const _insertion = await recorderCodeGenSession?.recordInputAsCode(
        ctx.debuggerTracker,
        event,
        eventData,
        method,
        queryArg0,
        queryOptions,
      )
      return recorderCodeGenSession?.insertions
    }),
})

export type PanelRouter = typeof panelRouter
