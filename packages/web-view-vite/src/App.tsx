import * as webviewToolkit from '@vscode/webview-ui-toolkit'
import { Show, createResource, createSignal } from 'solid-js'
import { createColorTheme } from './lib/color-theme'
import { createDomReplica } from './lib/create-dom-replica'
import { createInspectorHeight } from './lib/inspector-height'
import { Toolbar } from './components/Toolbar'
import { Inspector } from './components/Inspector'
import { Resizer } from './components/Resizer'
import { client } from './lib/panel-client'

// Importing the router type from the server file

// In order to use the Webview UI Toolkit web components they
// must be registered with the browser (i.e. webview) using the
// syntax below.
{
  const prefix = 'ui-test-visualizer'
  webviewToolkit
    .provideVSCodeDesignSystem()
    .register(webviewToolkit.vsCodeButton({ prefix }))
    .register(webviewToolkit.vsCodeCheckbox({ prefix }))
    .register(webviewToolkit.vsCodeProgressRing({ prefix }))
    .register(webviewToolkit.vsCodeTextField({ prefix }))
}

// TODO put these into a context provider

export const [replicaHtmlEl, setReplicaHtmlEl] = createSignal<HTMLHtmlElement>()
export const [theme, toggleTheme] = createColorTheme(
  replicaHtmlEl,
)
export const {
  shadowHost,
  refreshShadow,
  firstPatchReceived,
  flushHtmlPatches,
  stylesAreLoading,
} = createDomReplica()

export const inspector = createInspectorHeight()

export function App() {
  return (
    <div class="fixed inset-0 flex flex-col">
      <div style={{ visibility: firstPatchReceived() ? 'visible' : 'hidden' }}>
        <Toolbar />
      </div>
      <div class="relative h-full w-full">
        <div
          style={{ visibility: firstPatchReceived() ? 'hidden' : 'visible' }}
          class="fixed inset-0 flex justify-center items-center"
        >
          Waiting for the test DOM...
        </div>
        <div
          style={{ visibility: firstPatchReceived() ? 'visible' : 'hidden' }}
          class="absolute h-full w-full flex flex-col"
        >
          <div
            style={{
              height: inspector.isOpen() ? `calc(100% - ${inspector.height()}px)` : '100%',
            }}
          >
            {shadowHost}
          </div>
          <Show when={inspector.isOpen()}>
            <Resizer onResize={inspector.setHeight} />
            <div
              class="overflow-y-hidden"
              style={{ height: `${inspector.height()}px` }}
            >
              <Inspector />
            </div>
          </Show>
        </div>
      </div>
    </div>
  )
}
