import * as vscode from 'vscode'

/**
 * Creates a function that is restricted to invoking func once.
 * Repeat calls to the function return the value of the first call.
 * The func is invoked with the this binding and arguments of the created function.
 *
 * You can peek at the result of the first call to the function by calling the peek() method.
 *
 * Copied and adapted from lodash's 'once' function.
 */
export function onceWithPeek<T extends (...args: any[]) => any>(fn: T): {
  (): ReturnType<T>
  peek: () => ReturnType<T> | undefined
} {
  let called = false
  let result: ReturnType<T>

  const wrapper = (...args: Parameters<T>): ReturnType<T> => {
    if (!called) {
      result = fn(...args)
      called = true
    }
    return result
  }

  wrapper.peek = (): ReturnType<T> | undefined => {
    return called ? result : undefined
  }

  return wrapper
}

/**
 * Returns the editor for the given file path, or opens a new editor if it doesn't exist.
 */
export async function getOrOpenEditor(filePath: string) {
  let editor = vscode.window.visibleTextEditors.find(
    editor => editor.document.uri.path === filePath,
  )
  if (!editor) {
    const document = await vscode.workspace.openTextDocument(vscode.Uri.file(filePath))
    editor = await vscode.window.showTextDocument(document, vscode.ViewColumn.One)
  }
  return editor
}
