import * as vscode from 'vscode'
import type pkg from '../../../../package.json'

export type ExtensionSettingsKey = keyof (
  typeof pkg.contributes.configuration.properties
)

/** Type-safe way to get vscode exension settings */
export function extensionSetting(key: ExtensionSettingsKey) {
  const setting = vscode.workspace.getConfiguration().get(key)
  return setting
}
