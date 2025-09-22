import { Buffer } from 'node:buffer'
import * as path from 'pathe'
import * as vscode from 'vscode'
import { walk } from 'estree-walker'
import { zFrameworkSetting } from '../extension'
import { extensionSetting } from '../util/extension-setting'
import { detectTestFramework } from '../framework-support/detect-test-framework'
import { SUPPORTED_TESTING_LIBRARIES, detectTestLibrary } from '../framework-support/detect-test-library'

export async function createUiTestFile() {
  // @ts-expect-error import the wasm file directly
  const { parseSync } = await import('@oxc-parser/binding-wasm32-wasi')

  const editor = vscode.window.activeTextEditor
  if (!editor) {
    return
  }

  const doc = editor.document

  const selection = editor.selection
  const wordRange = doc.getWordRangeAtPosition(selection.active, /\w+/)
  const word = doc.getText(wordRange)

  if (!wordRange || !word) {
    vscode.window.showInformationMessage(
      `No valid identifier found. Must be an exported capitalized function name. Got ${word}`,
    )
    return
  }

  const { exportName, isDefaultExport } = (() => {
    const parsed = parseSync(doc.fileName, doc.getText(), {})
    const programJson = parsed.program
    const program = JSON.parse(programJson)

    let result: string | null = null
    let isDefaultExport = false
    walk(program, {
      enter(node) {
        if (node.type === 'ExportNamedDeclaration' || node.type === 'ExportDefaultDeclaration') {
          const nodeName = node?.declaration?.name
            ?? node?.declaration?.id?.name
            ?? node?.declaration?.declarations?.[0]?.id?.name
            ?? node?.declaration?.declarations?.[0]?.name
          if (nodeName === word) {
            result = nodeName ?? null
            isDefaultExport = node.type === 'ExportDefaultDeclaration'
          }
        }
      },
    })

    return { exportName: result as string | null, isDefaultExport }
  })()

  if (!exportName) {
    vscode.window.showInformationMessage(
      `No valid export found. Must be an exported capitalized function name. Got ${word}`,
    )
    return
  }

  // React/Solid component convention: starts with capital letter
  if (!/^[A-Z]/.test(exportName)) {
    vscode.window.showInformationMessage(
        `Selection must be a capitalized identifier, e.g. a React component name. Got "${word}".`,
    )
    return
  }

  const frameworkSetting = (() => {
    const parsed = zFrameworkSetting
      .safeParse(extensionSetting('ui-test-visualizer.testFramework'))
    return parsed.success ? parsed.data : 'autodetect'
  })()

  const frameworkInfo = await detectTestFramework(editor.document.uri.fsPath, frameworkSetting)
  const testingLibrary = await detectTestLibrary(editor.document.uri.fsPath)

  if (!testingLibrary) {
    vscode.window.showInformationMessage(`Could not detect a testing library for ${editor.document.uri.fsPath}. Supported testing libraries are ${SUPPORTED_TESTING_LIBRARIES.join(', ')}.`)
    return
  }

  const currentDir = path.dirname(editor.document.uri.fsPath)
  const testFileName = `${exportName}.test.tsx`
  const testFileUri = vscode.Uri.file(path.join(currentDir, testFileName))

  // Check if the test file already exists
  try {
    await vscode.workspace.fs.stat(testFileUri)
    vscode.window.showInformationMessage(`Test file ${testFileName} already exists.`)
    return
  }
  catch {
    // File does not exist, proceed to create
  }

  const relativePathToSrc = path.relative(currentDir, doc.fileName).replace(/\.[jt]sx?$/, '')

  // Create basic test content
  const isArrowRender = testingLibrary === '@solidjs/testing-library'
  const testContent = `import { describe, it } from '${frameworkInfo.framework}'
import { render } from '${testingLibrary}'
import ${isDefaultExport ? exportName : `{ ${exportName} }`} from './${relativePathToSrc}'

describe('${exportName}', () => {
  it('basic usage', async () => {
    render(${isArrowRender ? `() => <${exportName} />` : `<${exportName} />`})
  })
})
`

  // Write the file
  await vscode.workspace.fs.writeFile(testFileUri, Buffer.from(testContent, 'utf8'))

  // Open the new test file
  const newDocument = await vscode.workspace.openTextDocument(testFileUri)
  await vscode.window.showTextDocument(newDocument)
}
