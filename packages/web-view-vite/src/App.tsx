import clamp from 'lodash/clamp'
import debounce from 'lodash/debounce'
import { ErrorBoundary, Match, Show, Switch, createSignal } from 'solid-js'
import { Resizable, ResizableHandle, ResizablePanel } from './components/solid-ui/resizable'
import { Toolbar } from './components/Toolbar'
import { Inspector } from './inspector/Inspector'
import { createColorTheme } from './lib/color-theme'
import { createDomReplica } from './lib/create-dom-replica'
import { createRecorder } from './recorder/recorder'
import { RecorderPanel } from './recorder/recorder-panel'
import { ContextMenu } from './components/solid-ui/context-menu'
import { RecorderContextMenuProvider } from './recorder/recorder-context-menu'

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

export const STORAGE_KEY_INSPECTOR_IS_OPEN = 'ui-test-visualizer.inspector-is-open'
const inspectorWasOpen = localStorage.getItem(STORAGE_KEY_INSPECTOR_IS_OPEN) === 'true'

export type Panel = 'inspector' | 'recorder'
const [openPanel, _setOpenPanel] = createSignal<Panel | null>(
  inspectorWasOpen ? 'inspector' : null,
)
export { openPanel }

export function updateOpenPanel(newPanel: Panel | null) {
  _setOpenPanel(newPanel)
  if (newPanel === 'inspector' || newPanel === null) {
    localStorage.setItem(STORAGE_KEY_INSPECTOR_IS_OPEN, newPanel === 'inspector' ? 'true' : 'false')
  }
}

export const recorder = createRecorder(shadowHost)

export function App() {
  const { panelSizes, updateBottomPanelHeight } = createBottomPanelHeight()

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
          class="absolute h-full w-full"
        >
          <Resizable
            orientation="vertical"
            sizes={panelSizes()}
            onSizesChange={(sizes: number[]) => sizes[1] && updateBottomPanelHeight(sizes[1])}
          >
            <ResizablePanel class="overflow-y-auto">
              <RecorderContextMenuProvider class="h-full w-full">
                {shadowHost}
              </RecorderContextMenuProvider>
            </ResizablePanel>
            <Show when={openPanel()}>
              <ResizableHandle />
              <ResizablePanel class="overflow-y-auto">
                <Switch>
                  <Match when={openPanel() === 'recorder'}>
                    <ErrorBoundary fallback={error => (
                      <div class="text-error-foreground p-4">
                        Error showing the recorder UI{error instanceof Error ? `: ${error.message}` : ''}
                      </div>
                    )}
                    >
                      <RecorderPanel />
                    </ErrorBoundary>
                  </Match>
                  <Match when={openPanel() === 'inspector'}>
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
              </ResizablePanel>
            </Show>
          </Resizable>
        </div>
      </div>
    </div>
  )
}

/** Store the bottom panel size in localStorage and return a signal for the panel layout sizes. */
function createBottomPanelHeight() {
  const BOTTOMPANEL_SIZE_KEY = 'ui-test-visualizer.bottom-panel-size'
  const BOTTOMPANEL_DEFAULT_SIZE = 0.4
  const persistPanelSize = debounce((size: number) => {
    localStorage.setItem(BOTTOMPANEL_SIZE_KEY, size.toString())
  }, 200)
  const storedBottomPanelSize = Number(localStorage.getItem(BOTTOMPANEL_SIZE_KEY)) || BOTTOMPANEL_DEFAULT_SIZE

  const [bottomPanelHeight, _setBottomPanelHeight] = createSignal(BOTTOMPANEL_DEFAULT_SIZE)
  function updateBottomPanelHeight(newHeight: number) {
    newHeight = clamp(newHeight, 0.15, 0.8)
    _setBottomPanelHeight(newHeight)
    persistPanelSize(newHeight)
  }
  updateBottomPanelHeight(storedBottomPanelSize)

  function panelSizes() {
    return openPanel()
      ? [1 - bottomPanelHeight(), bottomPanelHeight()]
      : [1, 0]
  }

  return { panelSizes, updateBottomPanelHeight }
}
