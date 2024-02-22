import * as webviewToolkit from '@vscode/webview-ui-toolkit'
import { Brush, Moon, RefreshCw, Sun } from 'lucide-solid'
import { createSignal } from 'solid-js'
import { createColorTheme } from './lib/color-theme'
import { createDomReplica } from './lib/create-dom-replica'
import { Popover, PopoverContent, PopoverTrigger } from './components/popover'
import { StylePicker } from './components/StylePicker'

// Importing the router type from the server file

// In order to use the Webview UI Toolkit web components they
// must be registered with the browser (i.e. webview) using the
// syntax below.
webviewToolkit
  .provideVSCodeDesignSystem()
  .register(webviewToolkit.vsCodeButton())
  .register(webviewToolkit.vsCodeCheckbox())

export const [replicaHtmlEl, setReplicaHtmlEl] = createSignal<HTMLHtmlElement>()
export const [theme, toggleTheme] = createColorTheme(
  replicaHtmlEl,
)

export function App() {
  const {
    shadowHost,
    refreshShadow,
    firstPatchReceived,
  } = createDomReplica()

  const [stylePickerOpen, setStylePickerOpen] = createSignal(false)

  return (
    <div class="fixed inset-0">
      <div
        class="flex gap-2 p-2"
        style={{ visibility: firstPatchReceived() ? 'visible' : 'hidden' }}
      >
        <vscode-button
          appearance="secondary"
          onClick={refreshShadow}
          title="Refresh Html"
        >
          <RefreshCw />
        </vscode-button>
        <vscode-button
          class="h-10 w-10"
          appearance="secondary"
          onClick={toggleTheme}
          title={`Switch to ${theme() === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme() === 'dark' ? <Moon /> : <Sun />}
        </vscode-button>
        <Popover
          open={stylePickerOpen()}
          onOpenChange={open => setStylePickerOpen(open)}
        >
          <PopoverTrigger>
            <vscode-button
              class="h-10 w-10"
              appearance="secondary"
              title="Enable your styles"
            >
              <Brush />
            </vscode-button>
          </PopoverTrigger>
          <PopoverContent>
            <StylePicker onOkClick={() => setStylePickerOpen(false)} />
          </PopoverContent>
        </Popover>

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
