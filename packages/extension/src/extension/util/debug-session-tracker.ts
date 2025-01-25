import * as vscode from 'vscode'

export type DebugSessionTracker = ReturnType<typeof startDebugSessionTracker>

/**
 * Wrapper around the VSCode debug session with convenience methods.
 * Tracks the active debug session, which frame it's paused on,
 * and provides a method to run debug expressions.
 */
export function startDebugSessionTracker(
  rootSession: vscode.DebugSession,
  onFrameChange: () => void,
) {
  const sessions = new Set([rootSession])

  /** Tracks which frame each debug session is paused on. */
  const frameIds = new WeakMap<vscode.DebugSession, number>()

  const onChangeActive = vscode.debug.onDidChangeActiveDebugSession((newSession) => {
    if (newSession && isChildSession(newSession, rootSession)) {
      sessions.add(newSession)
    }
  })

  const frameIdTracker = vscode.languages.registerInlineValuesProvider('*', {
    provideInlineValues(_document, _viewPort, context, _token) {
      const activeSession = vscode.debug.activeDebugSession
      if (activeSession && isChildSession(activeSession, rootSession)) {
        frameIds.set(activeSession, context.frameId)
        onFrameChange()
      }
      return []
    },
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

  async function runDebugExpression(expression: string) {
    const uiSession = await getUiTestSession()
    if (!uiSession) {
      throw new Error('Could not find UI test session')
    }

    const frameId = frameIds.get(uiSession)
    if (!frameId) {
      throw new Error('Could not find debugger frame ID for UI test session')
    }

    const evalResult: EvalResult = await uiSession.customRequest(
      'evaluate',
      {
        expression,
        context: 'clipboard',
        frameId,
      },
    )

    const result = evalResult.result

    return result
  }

  return {
    getUiTestSession,
    runDebugExpression,
    dispose: () => {
      frameIdTracker.dispose()
      onChangeActive.dispose()
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

export interface EvalResult {
  type: string
  result: string
}
