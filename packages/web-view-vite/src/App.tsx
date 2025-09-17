import * as webviewToolkit from '@vscode/webview-ui-toolkit'
import { ErrorBoundary, Match, Show, Switch, createSignal } from 'solid-js'
import { createColorTheme } from './lib/color-theme'
import { createDomReplica } from './lib/create-dom-replica'
import { createInspectorHeight } from './inspector/inspector-height'
import { Toolbar } from './components/Toolbar'
import { Inspector } from './inspector/Inspector'
import { Resizer } from './inspector/Resizer'
import { createRecorder } from './recorder/recorder'
import { RecorderPanel } from './recorder/recorder-panel'

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
    .register(webviewToolkit.vsCodeRadio({ prefix }))
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

export const recorder = createRecorder(shadowHost)

export function App() {
  return (
    <div class="fixed inset-0 flex flex-col">
      <div class="z-60" style={{ visibility: firstPatchReceived() ? 'visible' : 'hidden' }}>
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
          <div class="flex-1">
            {shadowHost}
          </div>
          <Show when={inspector.isOpen() || recorder.isRecording()}>
            <div style={{ height: `${inspector.height()}px` }}>
              <Resizer onResize={inspector.updateHeight} />
              <Switch>
                <Match when={recorder.isRecording()}>
                  <ErrorBoundary fallback={error => (
                    <div class="text-error-foreground p-4">
                      Error showing the recorder UI{error instanceof Error ? `: ${error.message}` : ''}
                    </div>
                  )}
                  >
                    <RecorderPanel />
                  </ErrorBoundary>
                </Match>
                <Match when={inspector.isOpen()}>
                  <ErrorBoundary fallback={error => (
                    <div class="text-error-foreground p-4">
                      Error showing the inspector{error instanceof Error ? `: ${error.message}` : ''}
                    </div>
                  )}
                  >
                    <Inspector />
                  </ErrorBoundary>
                </Match>
              </Switch>
            </div>
          </Show>
        </div>
      </div>
    </div>
  )
}
