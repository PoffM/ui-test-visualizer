import { walk } from 'estree-walker'
import * as vscode from 'vscode'
import type { PanelController } from '../panel-controller/panel-controller'
import { getOrOpenEditor } from '../util/util'
import type { RecorderCodeInsertions } from './recorder-codegen-session'

export async function performEdit(
  filePath: string,
  insertions: RecorderCodeInsertions,
  panelController: PanelController,
) {
  if (Object.keys(insertions).length === 0) {
    // No edits to perform
    return
  }

  const editor = await getOrOpenEditor(filePath)

  if (!editor) {
    vscode.window.showErrorMessage(`No editor found for ${filePath.split('/').pop()}`)
    return
  }

  // eslint-disable-next-line ts/no-var-requires, ts/no-require-imports
  const { parseSync } = require('@oxc-parser/binding-wasm32-wasi')

  // Convert insertion line numbers to character indexes
  const insertionCharIndexes: number[] = []
  for (const line in insertions) {
    const lineNumber = Number.parseInt(line) - 1 // 0-based
    const position = new vscode.Position(lineNumber, 0)
    const offset = editor.document.offsetAt(position)
    insertionCharIndexes.push(offset)
  }

  const requiresAsync = Object.keys(insertions)
    .some(lineNum => insertions[Number(lineNum)]?.some(line => /\s*await*/.test(line[0])))

  const reverseOrderInsertions = Object.entries(insertions)
    .sort((a, b) => Number(b[0]) - Number(a[0]))

  await editor.edit((editBuilder) => {
    for (const [line, lines] of reverseOrderInsertions) {
      const lineNumber = Number.parseInt(line)
      const position = new vscode.Position(lineNumber - 1, 0)
      for (let [code, _requiredImports] of lines) {
        const indent: string = (() => {
          // Indent should be the longest indentation between the paused line and the previous line.
          // This is to make sure the right indent is used when paused at the end of the test.
          // e.g.
          // test('click button', () => {
          //   const button = screen.getByRole('button')
          //   button.click() <-- when paused here, use this line's indent.
          // }) <-- when paused here, use previous line's indent.

          const line1 = editor.document.lineAt(lineNumber - 1)
          const line2 = editor.document.lineAt(lineNumber - 2)
          return [line1, line2].map(it => it.text.match(/^\s*/)?.[0] || '').sort((a, b) => b.length - a.length)[0] || ''
        })()

        code = `${indent}${code}`

        editBuilder.insert(position, code)
      }
    }

    // Figure out where to put each import statement
    // Either add a new import, or edit an existing one to import something else
    const importInsertionPoints = new Map<string, number>()
    const existingImports = new Set<string>()
    {
      const parsed = parseSync(editor.document.fileName, editor.document.getText(), {})
      const programJson = parsed.program
      const program = JSON.parse(programJson)

      walk(program, {
        enter(node) {
          if (node.type === 'ImportDeclaration') {
            if (node.source.type === 'Literal') {
              const endOfLastSpecifier = node.specifiers.at(-1)?.end
              if (endOfLastSpecifier) {
                importInsertionPoints.set(node.source.value, endOfLastSpecifier)
              }
            }
            for (const specifier of node.specifiers) {
              if (['ImportSpecifier', 'ImportDefaultSpecifier', 'ImportNamespaceSpecifier'].includes(specifier.type)) {
                existingImports.add(specifier.local.name)
              }
            }
          }

          // When the test needs to be async, insert the 'async' keyword if it's missing
          if (
            requiresAsync
            // Find the running test
            && node.type === 'CallExpression' && ['it', 'fit', 'test'].includes(node?.callee.name)
          ) {
            for (const argNode of node.arguments) {
              // Find the arrow function containing the insertion char indexes
              if (
                ['FunctionDeclaration', 'FunctionExpression', 'ArrowFunctionExpression'].includes(argNode?.type ?? '')
                && argNode?.async === false
                && insertionCharIndexes.some(charIndex => charIndex >= argNode.start && charIndex <= argNode.end)
              ) {
                // Check if the function node contains any insertion char indexes
                for (const charIndex of insertionCharIndexes) {
                  if (charIndex >= argNode.start && charIndex <= argNode.end) {
                    const position = editor.document.positionAt(argNode.start)
                    editBuilder.insert(position, 'async ')
                  }
                }
              }
            }
          }
        },
      })
    }

    // Get the list of imports to add
    const importList: { importName: string, from: string }[] = []
    for (const [_lineNum, insertionGroup] of Object.entries(insertions)) {
      for (const [_code, requiredImports] of insertionGroup) {
        for (const [importName, from] of Object.entries(requiredImports)) {
          if (existingImports.has(importName)) {
            continue
          }

          importList.push({ importName, from })

          existingImports.add(importName)
        }
      }
    }

    // Edit the imports into the file
    for (const { importName, from } of importList) {
      const insertionPoint = importInsertionPoints.get(from)
      if (insertionPoint) {
        const position = editor.document.positionAt(insertionPoint)
        editBuilder.insert(position, `, ${importName}`)
      }
      else {
        editBuilder.insert(new vscode.Position(0, 0), `import { ${importName} } from '${from}'\n`)
      }
    }
  })

  // Remove the insertions from the state after they've been inserted into the code
  for (const line in insertions) {
    delete insertions[Number(line)]
  }

  panelController.notifyRecorderEditPerformed()

  await editor.document.save()
}
