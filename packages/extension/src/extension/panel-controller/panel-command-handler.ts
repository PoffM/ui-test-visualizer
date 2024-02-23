import * as vscode from 'vscode'
import { callProcedure } from '@trpc/server'
import type { MyStorageType } from '../extension'
import type { PanelRouterCtx } from './panel-router'
import { panelRouter } from './panel-router'

/** Tracks which frame each debug session is paused on. */
export const frameIds = new WeakMap<vscode.DebugSession, number>()

export function startPanelCommandHandler(
  panel: vscode.WebviewPanel,
  rootSession: vscode.DebugSession,
  storage: MyStorageType,
) {
  const frameIdTracker = vscode.languages.registerInlineValuesProvider('*', {
    provideInlineValues(_document, _viewPort, context, _token) {
      const activeSession = vscode.debug.activeDebugSession
      if (activeSession) {
        frameIds.set(activeSession, context.frameId)
      }
      return []
    },
  })

  const onPanelMessage = panel.webview.onDidReceiveMessage(async (e) => {
    const { path, input, type, id } = e

    try {
      const ctx: PanelRouterCtx = {
        getUiTestSession,
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

      panel.webview.postMessage({ id, data: result })
    }
    catch (error) {
      console.error(error)
      panel.webview.postMessage({
        id,
        error: error instanceof Error ? error.message : null,
      })
    }
  })

  const sessions = [rootSession]

  const onChangeActive = vscode.debug.onDidChangeActiveDebugSession((newSession) => {
    if (newSession && isChildSession(newSession, rootSession)) {
      sessions.push(newSession)
    }
  })

  /**
   * Find the UI test session based on whichever session is connected to a breakpoint.
   * TODO find a better way to do this.
   */
  async function getUiTestSession() {
    const bps = vscode.debug.breakpoints
    for (const session of sessions) {
      for (const bp of bps) {
        const dbp = await session.getDebugProtocolBreakpoint(bp)
        if (dbp && Reflect.get(dbp, 'verified') === true) {
          return session
        }
      }
    }
    return null
  }

  return {
    dispose: () => {
      onPanelMessage.dispose()
      onChangeActive.dispose()
      frameIdTracker.dispose()
    },
  }
}

function isChildSession(child: vscode.DebugSession, parent: vscode.DebugSession) {
  if (!child.parentSession) {
    return false
  }
  if (child.parentSession?.id === parent.id) {
    return true
  }
  return isChildSession(child.parentSession, parent)
}
