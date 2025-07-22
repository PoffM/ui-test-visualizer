import * as webviewToolkit from '@vscode/webview-ui-toolkit'
import { Show, createSignal } from 'solid-js'
import { createColorTheme } from './lib/color-theme'
import { createDomReplica } from './lib/create-dom-replica'
import { Toolbar } from './components/Toolbar'
import { Inspector } from './components/Inspector'
import { Resizer } from './components/Resizer'

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

export const [showInspector, setShowInspector] = createSignal(false)
export const [inspectorHeight, setInspectorHeight] = createSignal(300) // Default height of 300px

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
              height: showInspector() ? `calc(100% - ${inspectorHeight()}px)` : '100%',
            }}
          >
            {shadowHost}
          </div>
          <Show when={showInspector()}>
            <Resizer onResize={setInspectorHeight} />
            <div
              class="overflow-y-hidden"
              style={{ height: `${inspectorHeight()}px` }}
            >
              <Inspector />
            </div>
          </Show>
        </div>
      </div>
    </div>
  )
}
