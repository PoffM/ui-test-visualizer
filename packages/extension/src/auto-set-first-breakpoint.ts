import * as vscode from 'vscode'
import get from 'lodash/get'

export function autoSetFirstBreakpoint(
  testFile: string,
  startAndEndLines: [number, number],
  firstStatementStartLine: number | null,
) {
  let newBreakpoint: vscode.SourceBreakpoint | undefined

  // Place a breakpoint at the start of the test if there is none
  const [testStart, testEnd] = startAndEndLines
  if (typeof testStart === 'number' && typeof testEnd === 'number') {
    let hasBreakpointInTest = false

    for (const bp of vscode.debug.breakpoints) {
      const bpStart: unknown = get(bp, ['location', 'range', 'start', 'line'])
      const bpEend: unknown = get(bp, ['location', 'range', 'end', 'line'])
      const bpPath: unknown = get(bp, ['location', 'uri', 'path'])
      if (
        typeof bpStart === 'number'
        && typeof bpEend === 'number'
        && bpPath === testFile

        // If the breakpoint is in the test block
        && (bpStart >= testStart && bpEend <= testEnd)
      ) {
        hasBreakpointInTest = true
        break
      }
    }

    if (!hasBreakpointInTest && firstStatementStartLine !== null) {
      newBreakpoint = new vscode.SourceBreakpoint(
        new vscode.Location(
          vscode.Uri.file(testFile),
          new vscode.Position(firstStatementStartLine, 0),
        ),
        true,
      )
      vscode.debug.addBreakpoints([newBreakpoint])
    }
  }

  return {
    dispose: () => {
      if (newBreakpoint) {
        vscode.debug.removeBreakpoints([newBreakpoint])
      }
    },
  }
}
