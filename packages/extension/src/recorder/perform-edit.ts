import { walk } from 'estree-walker'
import * as vscode from 'vscode'
import type { PanelController } from '../panel-controller/panel-controller'
import type { RecorderCodeInsertions } from './recorder-codegen-session'

export async function performEdit(
  editor: vscode.TextEditor | undefined,
  insertions: RecorderCodeInsertions,
  panelController: PanelController,
) {
  if (Object.keys(insertions).length === 0) {
    // No edits to perform
    return
  }

  if (!editor) {
    vscode.window.showInformationMessage('No editor found')
    return
  }

  // eslint-disable-next-line ts/no-var-requires, ts/no-require-imports
  const { parseSync } = require('@oxc-parser/binding-wasm32-wasi')

  const reverseOrderInsertions = Object.entries(insertions)
    .sort((a, b) => Number(b[0]) - Number(a[0]))

  await editor.edit((editBuilder) => {
    for (const [line, lines] of reverseOrderInsertions) {
      const lineNumber = Number.parseInt(line)
      const position = new vscode.Position(lineNumber - 1, 0)
      for (const [line, _requiredImports] of lines) {
        editBuilder.insert(position, line)
      }
    }

    // Figure out where to put each import statement
    // Either add a new import, or edit an existing one to import something else
    const importInsertionPoints = new Map<string, number>()
    const existingImports = new Set<string>()
    {
    // TODO avoid re-parsing for every generated line of code?
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
  for (const line of Object.keys(insertions)) {
    delete insertions[Number(line)]
  }

  panelController.notifyRecorderEditPerformed()

  await editor.document.save()
}
