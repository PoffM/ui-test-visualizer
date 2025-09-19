import * as vscode from 'vscode'

export type DebuggerTracker = ReturnType<typeof startDebuggerTracker>

export interface DebugPauseLocation {
  filePath: string
  lineNumber: number
}

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
    onDebugTerminated,
  }: {
    onFrameChange: () => void
    onDebugRestarted: () => void
    onDebugTerminated: () => void
  },
) {
  const disposables = new Set<vscode.Disposable>()

  // Call the onDebugRestarted callback function when the Restart button is clicked and the new debug session hits its first breakpoint
  {
    let hasHitFirstBreakpoint = false
    const startedSessions = new WeakSet<vscode.DebugSession>()
    disposables.add(vscode.debug.onDidStartDebugSession(session => startedSessions.add(session)))
    disposables.add(vscode.debug.onDidTerminateDebugSession((session) => {
      startedSessions.delete(session)

      if (session === rootSession) {
        onDebugTerminated()
      }
    }))
    disposables.add(vscode.debug.onDidChangeActiveStackItem((stackItem) => {
      if (stackItem && startedSessions.has(stackItem?.session)) {
        if (hasHitFirstBreakpoint) {
          // If this branch is hit, the restarted debug session has hit its first breakpoint.
          onDebugRestarted()
        }
        else {
          hasHitFirstBreakpoint = true
        }

        // Stop listening for this debug session
        startedSessions.delete(stackItem.session)
      }
    }))
  }

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

  async function getPausedLocation(): Promise<DebugPauseLocation | null> {
    const session = vscode.debug.activeDebugSession
    if (!session) {
      return null
    }
    try {
      const response = await session.customRequest('stackTrace', {
        threadId: 1, // TODO is this always the right threadId?
        startFrame: 0,
        levels: 1,
      })
      if (response.stackFrames && response.stackFrames.length > 0) {
        const frame = response.stackFrames[0]
        const fileUri = frame.source?.path
        const lineNumber = frame.line
        const filePath = vscode.Uri.parse(fileUri).fsPath
        return { filePath, lineNumber }
      }
      else {
        vscode.window.showInformationMessage('No stack frames')
        return null
      }
    }
    catch (error) {
      vscode.window.showErrorMessage(`Error: ${error}`)
      return null
    }
  }

  return {
    runDebugExpression,
    getPausedLocation,
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
