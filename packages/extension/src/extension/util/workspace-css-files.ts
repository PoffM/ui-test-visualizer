import * as vscode from 'vscode'

export async function workspaceCssFiles() {
  const workspaceFiles = await vscode.workspace.findFiles(
    '{**/*.css,**/*.sass,**/*.scss,**/*.styl,**/*.stylus}',
    '**/node_modules/**',
  )

  const workspacePaths = workspaceFiles.map(it => it.path)
  return workspacePaths
}
