import { Brush, Moon, RefreshCw, Sun } from 'lucide-solid'
import { createSignal } from 'solid-js'
import { firstPatchReceived, refreshShadow, theme, toggleTheme } from '../App'
import { Popover, PopoverContent, PopoverTrigger } from './popover'
import { StylePicker } from './StylePicker'

export function Toolbar() {
  const [stylePickerOpen, setStylePickerOpen] = createSignal(false)

  return (
    <div
      class="flex gap-2 p-2"
      style={{ visibility: firstPatchReceived() ? 'visible' : 'hidden' }}
    ><vscode-button
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
  )
}
