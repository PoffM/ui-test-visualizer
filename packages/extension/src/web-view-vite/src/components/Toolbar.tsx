import { Moon, RefreshCw, Sun } from 'lucide-solid'
import { firstPatchReceived, refreshShadow, theme, toggleTheme } from '../App'
import { StyleIcon, StylePicker } from './StylePicker'

export function Toolbar() {
  return (
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
      <StylePicker
        button={isRefreshing => (
          <vscode-button
            class="h-10 w-10"
            appearance="secondary"
            title="Enable your styles"
          >
            {isRefreshing
              ? <vscode-progress-ring class="w-[16px] h-[16px]" />
              : <StyleIcon />}
          </vscode-button>
        )}
      />
    </div>
  )
}
