import * as vscode from 'vscode'

export async function workspaceCssFiles() {
  const workspaceFiles = await vscode.workspace.findFiles(
    '{**/*.css,**/*.sass,**/*.scss,**/*.styl,**/*.stylus,**/*.less}',
    '**/node_modules/**',
  )

  const workspacePaths = workspaceFiles.map(it => it.fsPath)
  return workspacePaths
}
