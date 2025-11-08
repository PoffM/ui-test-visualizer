import Code from 'lucide-solid/icons/code'
import Info from 'lucide-solid/icons/info'
import Moon from 'lucide-solid/icons/moon'
import RefreshCw from 'lucide-solid/icons/refresh-cw'
import Sun from 'lucide-solid/icons/sun'
import { type ParentProps, Show, createSignal } from 'solid-js'
import { firstPatchReceived, openPanel, recorder, refreshShadow, theme, toggleTheme, updateOpenPanel } from '../App'
import { StyleIcon, StylePicker } from './StylePicker'
import { Popover, PopoverArrow, PopoverContent, PopoverTrigger } from './solid-ui/popover'
import { Tooltip, TooltipContent, TooltipTrigger } from './solid-ui/tooltip'

export function Toolbar() {
  const [recorderPopoverOpen, setRecorderPopoverOpen] = createSignal(false)
  return (
    <div
      class="flex gap-2 p-2 bg-(--vscode-panel-background)"
      style={{ visibility: firstPatchReceived() ? 'visible' : 'hidden' }}
    >
      <ToolbarButton
        onClick={() => updateOpenPanel(openPanel() === 'inspector' ? null : 'inspector')}
        label="Toggle Inspector"
      >
        <Code
          classList={{ 'text-[#75beff]': openPanel() === 'inspector' }}
        />
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
      <div class="flex [--button-padding-horizontal:0px] [--button-padding-vertical:0px]">
        <ToolbarButton
          onClick={() => recorder.toggle(!recorder.isRecording())}
          label={recorder.isRecording() ? 'Stop recording' : 'Record input as code'}
        >
          <div class="flex flex-col items-center">
            <div class="font-medium -mt-0.5">REC</div>
            <div
              class="w-4 aspect-square rounded-full bg-gray-300"
              classList={{
                'bg-red-500': recorder.isRecording(),
                'bg-gray-400': !recorder.isRecording(),
              }}
            >
            </div>
          </div>
        </ToolbarButton>
        <Show when={recorder.isRecording()}>
          <Popover
            open={recorderPopoverOpen()}
            onOpenChange={open => setRecorderPopoverOpen(open)}
          >
            <PopoverTrigger>
              <ToolbarButton
                appearance="icon"
                label="Test Recorder Info"
              >
                <Info class="w-6 h-6" />
              </ToolbarButton>
            </PopoverTrigger>
            <PopoverContent class="w-[450px] flex flex-col gap-1">
              <PopoverArrow />
              <h1 class="text-lg font-semibold mb-2">Test Recorder Info</h1>
              <ul class="list-disc list-inside space-y-1">
                <li>'Step Over' with the debugger to where you want to generate new code.</li>
                <li>Left-click an element or change a text input to generate code.</li>
                <li>Right-click an element to generate 'expect' statements or other mouse events.</li>
                <li>When you end or restart the test, the generated code is inserted into the test file.</li>
                <li>
                  Note: Your UI is not actually running in this panel, so certain interactions might not behave as expected.
                  Your UI is running in your test process as usual, and this panel shows a live replica.
                  When you interact here, the generated testing-library code is executed in the test process.
                </li>
              </ul>
              <div class="flex justify-center">
                <ui-test-visualizer-button
                  appearance="primary"
                  title="Apply styles"
                  onClick={() => setRecorderPopoverOpen(false)}
                >
                  OK
                </ui-test-visualizer-button>
              </div>
            </PopoverContent>
          </Popover>
        </Show>
      </div>
    </div>
  )
}

interface ToolbarButtonProps extends ParentProps {
  label: string
  onClick?: () => void
  appearance?: string
}

function ToolbarButton(props: ToolbarButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger>
        <ui-test-visualizer-button
          class="h-10 w-10"
          appearance={props.appearance ?? 'secondary'}
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
