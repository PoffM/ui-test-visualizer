import { watch } from 'node:fs'
import type * as vscode from 'vscode'
import debounce from 'lodash/debounce'

// Hot-reload for development
declare global {
// eslint-disable-next-line vars-on-top
  var hmrStarted: boolean
}

export function enableHotReload(vscodeContext: vscode.ExtensionContext, filename: string, deactivate: () => void) {
  if (process.env.NODE_ENV === 'development' && !globalThis.hmrStarted) {
    globalThis.hmrStarted = true
    const debouncedReload = debounce(() => {
      delete require.cache[filename]
      // eslint-disable-next-line ts/no-require-imports, ts/no-var-requires
      const newMod = require(filename)
      deactivate()
      newMod.activate(vscodeContext)
      deactivate = newMod.deactivate
      console.log(`Reloaded ${filename}`)
    }, 100)

    watch(filename).on('change', () => debouncedReload())
  }
}
