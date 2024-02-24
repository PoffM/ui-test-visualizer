import type { ParsedNode } from 'jest-editor-support'
import { ItBlock, parse } from 'jest-editor-support'
import type * as vscode from 'vscode'
import { CodeLens, Range } from 'vscode'
import get from 'lodash/get'

export const codeLensProvider: vscode.CodeLensProvider = {
  provideCodeLenses(document) {
    try {
      const rootNode = parse(document.fileName, document.getText(), {
        plugins: { decorators: 'legacy' },
      }).root

      const codeLenses: vscode.CodeLens[] = []
      for (const node of allNodes(rootNode)) {
        if (node instanceof ItBlock) {
          const range = new Range(
            node.start.line - 1,
            node.start.column,
            node.end.line - 1,
            node.end.column,
          )

          // Get the first and last lines in the test block
          const startAndEndLines = (() => {
            const bodyLen = get(node, ['testBlock', 'body', 'length'])
            if (!(typeof bodyLen === 'number')) {
              return null
            }

            // First line in the test
            const start: unknown = get(node, ['testBlock', 'body', '0', 'loc', 'start', 'line'])

            // Last line in the test
            const end: unknown = get(node, ['testBlock', 'body', bodyLen - 1, 'loc', 'end', 'line'])

            if (!(typeof start === 'number' && typeof end === 'number')) {
              return null
            }

            return [start, end]
          })()

          codeLenses.push(
            new CodeLens(range, {
              arguments: [node.file, node.name, startAndEndLines],
              title: 'Visually Debug UI',
              command: 'visual-ui-test-debugger.visuallyDebugUI',
            }),
          )
        }
      }

      return codeLenses
    }
    catch (e) {
      // Ignore error and keep showing Run/Debug buttons at same position
      console.error('jest-editor-support parser threw error', e)
    }
  },
}

/** Iterate over all nodes in the tree. */
function* allNodes(node: ParsedNode): Generator<ParsedNode> {
  yield node
  for (const child of node.children ?? []) {
    yield* allNodes(child)
  }
}
