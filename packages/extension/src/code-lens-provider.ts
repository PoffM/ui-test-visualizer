import { walk } from 'estree-walker'
import path from 'pathe'
import type * as vscode from 'vscode'
import { CodeLens, Range } from 'vscode'

interface TestBlock {
  name: string
  span: [number, number]
  firstStatementStartChar: number | null
}

interface ProcessedTestBlock {
  name: string
  range: Range
  firstStatementStartLine: number | null
}

/** Stored the last code lenses for valid code */
const cache = new WeakMap<vscode.TextDocument, vscode.CodeLens[]>()

export const codeLensProvider: vscode.CodeLensProvider = {
  async provideCodeLenses(document) {
    try {
      const codeLenses: vscode.CodeLens[] = []

      const code = document.getText()

      // @ts-expect-error normally we don't import directly from the wasm package,
      // but bundling is easier this way because the main oxc-parser package tries to import the native modules first,
      // which fails during build.

      // Also use 'await import' here to wait until a test file is opened before loading the wasm file.
      // Idk if this really makes a difference.
      const { parseSync } = await import('@oxc-parser/binding-wasm32-wasi')

      const parsed = parseSync(document.fileName, code, {})
      const programJson = parsed.program
      const program = JSON.parse(programJson)

      // If there is a parsing error, return the last valid code lenses for this file
      if (parsed.errors.length > 0) {
        return cache.get(document) ?? []
      }

      const testBlocks: TestBlock[] = []
      walk(program, {
        enter(node) {
          if (node.type === 'CallExpression' && ['it', 'fit', 'test'].includes(node?.callee.name)) {
            const name = node?.arguments?.[0]?.value
            let firstStatementStartChar: number | null = Number(node?.arguments?.[1]?.body?.body?.[0]?.start ?? undefined)
            if (Number.isNaN(firstStatementStartChar)) {
              firstStatementStartChar = null
            }

            if (typeof name === 'string') {
              testBlocks.push({
                name,
                span: [node.start, node.end],
                firstStatementStartChar,
              })
            }
          }
        },
      })

      for (const { name, range, firstStatementStartLine } of spansToVsCodeRanges(code, testBlocks)) {
        codeLenses.push(
          new CodeLens(range, {
            arguments: [path.resolve(document.fileName), name, [range.start.line, range.end.line], firstStatementStartLine],
            title: 'Visually Debug UI',
            command: 'ui-test-visualizer.visuallyDebugUI',
          }),
        )
      }

      cache.set(document, codeLenses)
      return codeLenses
    }
    catch (e) {
      // Ignore error and keep showing Run/Debug buttons at same position
      console.error('Oxc wasm parser parser threw error', e)
    }
  },
}

function spansToVsCodeRanges(
  code: string,
  testBlocks: TestBlock[],
): ProcessedTestBlock[] {
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

  return testBlocks.map((testBlock) => {
    const [start, end] = testBlock.span
    return ({
      name: testBlock.name,
      range: new Range(
        ...findLineAndColumn(start),
        ...findLineAndColumn(end),
      ),
      firstStatementStartLine: testBlock.firstStatementStartChar ? findLineAndColumn(testBlock.firstStatementStartChar)[0] : null,
    })
  })
}
