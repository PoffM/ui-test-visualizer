import { Buffer } from 'node:buffer'
import type { ParseResult } from 'oxc-parser'
import * as path from 'pathe'
import * as vscode from 'vscode'
import { zFrameworkSetting } from '../../extension'
import { detectTestFramework } from '../../framework-support/detect-test-framework'
import { SUPPORTED_TESTING_LIBRARIES, detectTestLibrary } from '../../framework-support/detect-test-library'
import { extensionSetting } from '../../util/extension-setting'
import { createUITestCode } from './create-ui-test-code'

export async function createUiTestFile() {
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

  const docFileName = doc.fileName
  const docText = doc.getText()

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

  const relativePathToSrc = path.relative(currentDir, doc.fileName).replace(/\.[jt]sx?$/, '')

  // @ts-expect-error import the wasm file directly
  const { parseSync } = (await import('@oxc-parser/binding-wasm32-wasi')) as typeof import('oxc-parser')

  let program: ParseResult = parseSync(docFileName, docText, {}).program
  // @ts-expect-error needs to be JSON.parse'd when using the wasm parser
  program = JSON.parse(program)

  const [error, result] = await createUITestCode({ program, word, frameworkInfo, testingLibrary, relativePathToSrc })
  if (error) {
    vscode.window.showInformationMessage(error.message)
    return
  }
  const { exportName, testContent } = result

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

  // Write the file
  await vscode.workspace.fs.writeFile(testFileUri, Buffer.from(testContent, 'utf8'))

  // Open the new test file
  const newDocument = await vscode.workspace.openTextDocument(testFileUri)
  await vscode.window.showTextDocument(newDocument)
}
