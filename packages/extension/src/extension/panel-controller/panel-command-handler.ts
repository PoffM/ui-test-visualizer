import * as vscode from 'vscode'
import { callProcedure, initTRPC } from '@trpc/server'

/** Tracks which frame each debug session is paused on. */
const frameIds = new WeakMap<vscode.DebugSession, number>()

interface PanelRouterCtx {
  getUiTestSession: () => Promise<vscode.DebugSession | null>
}

const t = initTRPC.context<PanelRouterCtx>().create()

/** Defines routes callable from the WebView to the Extension back-end. */
const panelRouter = t.router({
  refresh: t.procedure
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
})

export type PanelRouter = typeof panelRouter

export interface EvalResult {
  type: string
  result: string
}

export function startPanelCommandHandler(
  panel: vscode.WebviewPanel,
  rootSession: vscode.DebugSession,
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
    const { cmd, token } = e

    try {
      const result = await callProcedure({
        procedures: panelRouter._def.procedures,
        ctx: { getUiTestSession },
        path: cmd,
        rawInput: undefined,
        input: undefined,
        type: 'query',
      })

      panel.webview.postMessage({ token, html: result })
    }
    catch (error) {
      console.error(error)
      panel.webview.postMessage({
        token,
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
