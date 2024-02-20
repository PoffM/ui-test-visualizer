import * as vscode from 'vscode'

interface EvalResult {
  type: string
  result: string
}

export function startPanelCommandHandler(
  panel: vscode.WebviewPanel,
  rootSession: vscode.DebugSession,
) {
  const onPanelMessage = panel.webview.onDidReceiveMessage(async (e) => {
    if (e === 'refresh') {
      const uiSession = await getUiTestSession()
      if (!uiSession) {
        throw new Error('Could not find UI test session')
      }

      const serializedHtml: EvalResult = await uiSession.customRequest(
        'evaluate',
        {
          expression: 'globalThis.__serializeHtml()',
          context: 'repl',
        },
      )

      console.log(serializedHtml)
    }
  })

  const sessions = [rootSession]

  const onChangeActive = vscode.debug.onDidChangeActiveDebugSession((newSession) => {
    if (newSession && isChildSession(newSession, rootSession)) {
      sessions.push(newSession)
    }
  })

  async function getUiTestSession() {
    const bps = vscode.debug.breakpoints
    for (const session of sessions) {
      for (const bp of bps) {
        const dbp = await session.getDebugProtocolBreakpoint(bp)
        if (dbp && Reflect.get(dbp, 'verified') === true) {
          console.log('ui session', session)
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
