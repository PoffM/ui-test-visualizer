import * as vscode from 'vscode'

export type DebuggerTracker = ReturnType<typeof startDebuggerTracker>

/**
 * Wrapper around the VSCode debug session with convenience methods.
 * Emits debugger-related events e.g. onFrameChange (Step Over) and onDebugRestarted (the Restart button is clicked).
 * and provides a method to run debug expressions.
 */
export function startDebuggerTracker(
  rootSession: vscode.DebugSession,
  {
    onFrameChange,
    onDebugRestarted,
  }: { onFrameChange: () => void, onDebugRestarted: () => void },
) {
  const disposables = new Set<vscode.Disposable>()

  disposables.add(
    vscode.debug.onDidChangeActiveDebugSession((newSession) => {
      if (!(newSession && isChildSession(newSession, rootSession))) {
        // This 'else' should run when the restart button is clicked, and a new debug session starts.
        // Use an 'ActiveStackItem' to run some code when the next breakpoint is hit, so the WebView can do a refresh.
        const listener = vscode.debug.onDidChangeActiveStackItem(() => {
          onDebugRestarted()
          listener.dispose()
          disposables.delete(listener)
        })
        disposables.add(listener)
      }
    }),
  )

  disposables.add(
    vscode.debug.onDidChangeActiveStackItem(() => {
      const activeSession = vscode.debug.activeDebugSession
      if (activeSession && isChildSession(activeSession, rootSession)) {
        onFrameChange()
      }
      return []
    }),
  )

  async function runDebugExpression(expression: string) {
    const uiSession = vscode.debug.activeDebugSession
    if (!uiSession) {
      throw new Error('Internal extension error: Could not find UI test session')
    }

    const stackTrace = await uiSession.customRequest('stackTrace', {
      threadId: 1, // TODO is this always the right threadId?
      startFrame: 0,
      levels: 1,
    })

    const frameId = stackTrace.stackFrames[0].id
    if (!frameId) {
      throw new Error('Internal extension error: Could not find debugger frame ID for UI test session')
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
    runDebugExpression,
    dispose: () => {
      for (const disposable of disposables) {
        disposable.dispose()
      }
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
