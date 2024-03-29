import * as webviewToolkit from '@vscode/webview-ui-toolkit'
import { createSignal } from 'solid-js'
import { createColorTheme } from './lib/color-theme'
import { createDomReplica } from './lib/create-dom-replica'
import { Toolbar } from './components/Toolbar'

// Importing the router type from the server file

// In order to use the Webview UI Toolkit web components they
// must be registered with the browser (i.e. webview) using the
// syntax below.
webviewToolkit
  .provideVSCodeDesignSystem()
  .register(webviewToolkit.vsCodeButton())
  .register(webviewToolkit.vsCodeCheckbox())
  .register(webviewToolkit.vsCodeProgressRing())

// TODO put these into a context provider

export const [replicaHtmlEl, setReplicaHtmlEl] = createSignal<HTMLHtmlElement>()
export const [theme, toggleTheme] = createColorTheme(
  replicaHtmlEl,
)
export const {
  shadowHost,
  refreshShadow,
  firstPatchReceived,
} = createDomReplica()

export function App() {
  return (
    <div class="fixed inset-0">
      <div style={{ visibility: firstPatchReceived() ? 'visible' : 'hidden' }}>
        <Toolbar />
      </div>
      <div class="relative h-full w-full">
        <div
          style={{ visibility: firstPatchReceived() ? 'hidden' : 'visible' }}
          class="absolute h-full w-full flex justify-center items-center"
        >
          Listening for test DOM mutations...
        </div>
        <div
          style={{ visibility: firstPatchReceived() ? 'visible' : 'hidden' }}
          class="absolute h-full w-full"
        >
          {shadowHost}
        </div>
      </div>
    </div>
  )
}
