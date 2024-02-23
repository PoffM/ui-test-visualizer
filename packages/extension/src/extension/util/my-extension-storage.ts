import type * as vscode from 'vscode'
import { z } from 'zod'
import { workspaceCssFiles } from '../extension'
import type { SafeStorage } from './extension-storage'
import { extensionStorage } from './extension-storage'

function myExtensionStorage(extensionContext: vscode.ExtensionContext) {
  const schema = {
    enabledCssFiles: z.array(z.string()),
    externalCssFiles: z.array(z.string()),
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
