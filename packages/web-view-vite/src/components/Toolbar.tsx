import Sun from 'lucide-solid/icons/sun'
import Moon from 'lucide-solid/icons/moon'
import RefreshCw from 'lucide-solid/icons/refresh-cw'
import Code from 'lucide-solid/icons/code'
import type { ParentProps } from 'solid-js'
import { firstPatchReceived, inspector, refreshShadow, theme, toggleTheme } from '../App'
import { StyleIcon, StylePicker } from './StylePicker'
import { Tooltip, TooltipContent, TooltipTrigger } from './tooltip'

export function Toolbar() {
  return (
    <div
      class="flex gap-2 p-2"
      style={{ visibility: firstPatchReceived() ? 'visible' : 'hidden' }}
    >
      <ToolbarButton
        onClick={inspector.toggle}
        label="Toggle Inspector"
      >
        <Code />
      </ToolbarButton>
      <ToolbarButton
        onClick={refreshShadow}
        label="Refresh Panel HTML"
      >
        <RefreshCw />
      </ToolbarButton>
      <ToolbarButton
        onClick={toggleTheme}
        label={`Switch to ${theme() === 'dark' ? 'light' : 'dark'} mode`}
      >
        {theme() === 'dark' ? <Moon /> : <Sun />}
      </ToolbarButton>
      <StylePicker
        button={isRefreshing => (
          <ToolbarButton
            label="Enable your styles"
          >
            {isRefreshing
              ? <ui-test-visualizer-progress-ring class="w-[16px] h-[16px]" />
              : <StyleIcon />}
          </ToolbarButton>
        )}
      />
    </div>
  )
}

interface ToolbarButtonProps extends ParentProps {
  label: string
  onClick?: () => void
}

function ToolbarButton(props: ToolbarButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger>
        <ui-test-visualizer-button
          class="h-10 w-10"
          appearance="secondary"
          onClick={props.onClick}
          aria-label={props.label}
        >
          {props.children}
        </ui-test-visualizer-button>
      </TooltipTrigger>
      <TooltipContent>
        <p>{props.label}</p>
      </TooltipContent>
    </Tooltip>
  )
}
