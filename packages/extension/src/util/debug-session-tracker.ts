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

  async function runDebugExpression(expression: string) {
    const uiSession = vscode.debug.activeDebugSession
    if (!uiSession) {
      throw new Error('Internal extension error: Could not find UI test session')
    }

    const frameId = frameIds.get(uiSession)
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

  interface DebugPauseLocation {
    filePath: string
    lineNumber: number
    indent: number
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
        const indent = frame.column - 1
        const filePath = vscode.Uri.parse(fileUri).fsPath
        return { filePath, lineNumber, indent }
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
