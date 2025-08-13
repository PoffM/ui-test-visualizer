import { walk } from 'estree-walker'
// import { parseSync as oxcParse } from 'oxc-parser'
import { Parser as AcornParser } from 'acorn'
import { tsPlugin as acornTsPlugin } from '@sveltejs/acorn-typescript'
import path from 'pathe'
import type * as vscode from 'vscode'
import { CodeLens, Range } from 'vscode'

interface TestBlock {
  name: string
  span: [number, number]
}

const AcornTsParser = AcornParser.extend(acornTsPlugin({ jsx: true }))

export const codeLensProvider: vscode.CodeLensProvider = {
  provideCodeLenses(document) {
    try {
      const codeLenses: vscode.CodeLens[] = []

      const code = document.getText()

      // const parsed = oxcParse(document.fileName, code, {})
      const parsed = AcornTsParser.parse(code, {
        ecmaVersion: 'latest',
        // sourceType: 'module',
        allowAwaitOutsideFunction: true,
        allowHashBang: true,
        allowImportExportEverywhere: true,
        allowReserved: true,
        allowReturnOutsideFunction: true,
        allowSuperOutsideMethod: true,
      })

      const testBlocks: TestBlock[] = []
      walk(parsed, {
        enter(node) {
          if (node.type === 'CallExpression' && ['it', 'fit', 'test'].includes(node?.callee.name)) {
            const name = node?.arguments?.[0]?.value
            if (typeof name === 'string') {
              testBlocks.push({ name, span: [node.start, node.end] })
            }
          }
        },
      })

      for (const { name, range } of spansToVsCodeRanges(code, testBlocks)) {
        codeLenses.push(
          new CodeLens(range, {
            arguments: [path.resolve(document.fileName), name, [range.start.line, range.end.line]],
            title: 'Visually Debug UI',
            command: 'ui-test-visualizer.visuallyDebugUI',
          }),
        )
      }

      return codeLenses
    }
    catch (e) {
      // Ignore error and keep showing Run/Debug buttons at same position
      console.error('jest-editor-support parser threw error', e)
    }
  },
}

function spansToVsCodeRanges(
  code: string,
  testBlocks: TestBlock[],
): { name: string, range: Range }[] {
  // Find newline indices using regex
  const newlineIndices: number[] = []
  for (const match of code.matchAll(/\n/g)) {
    newlineIndices.push(match.index!)
  }

  function findLineAndColumn(pos: number): [number, number] {
    let low = 0; let high = newlineIndices.length - 1
    while (low <= high) {
      const mid = (low + high) >> 1
      if (newlineIndices[mid]! < pos) {
        low = mid + 1
      }
      else {
        high = mid - 1
      }
    }
    const line = low
    const col = pos - (low > 0 ? newlineIndices[low - 1]! + 1 : 0) + 1 // 1-based col
    return [line, col]
  }

  return testBlocks.map(({ name, span: [start, end] }) => ({
    name,
    range: new Range(
      ...findLineAndColumn(start),
      ...findLineAndColumn(end),
    ),
  }))
}
