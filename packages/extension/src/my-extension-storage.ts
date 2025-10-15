import type * as vscode from 'vscode'
import * as z from 'zod/mini'
import type { SafeStorage } from './util/extension-storage'
import { extensionStorage } from './util/extension-storage'
import { workspaceCssFiles } from './util/workspace-css-files'

export function myExtensionStorage(extensionContext: vscode.ExtensionContext) {
  const schema = {
    enabledCssFiles: z.array(z.string()),
    externalCssFiles: z.array(z.string()),

    /** Whether to hide the one-time message asking you to enable styles. */
    stylePromptDismissed: z.boolean(),
  }

  type StorageShape = {
    [P in keyof typeof schema]: z.infer<typeof schema[P]>
  }

  const storage: SafeStorage<StorageShape> = extensionStorage(schema, {
    enabledCssFiles: async (paths) => {
      const workspacePaths = await workspaceCssFiles()
      const externalFiles = await storage.get('externalCssFiles')
      const validFiles = paths.filter(it =>
        workspacePaths.includes(it)
        || externalFiles?.includes(it),
      )
      return validFiles
    },
  }, extensionContext)

  return storage
}

export type MyStorageType = ReturnType<typeof myExtensionStorage>
