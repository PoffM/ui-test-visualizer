import get from 'lodash/get'
import Brush from 'lucide-solid/icons/brush'
import X from 'lucide-solid/icons/x'
import type { JSX } from 'solid-js'
import { For, Show, createEffect, createResource, createSignal } from 'solid-js'
import { firstPatchReceived, flushHtmlPatches, stylesAreLoading } from '../App'
import '../index.css'
import { client } from '../lib/panel-client'
import { Popover, PopoverArrow, PopoverContent, PopoverTrigger } from './popover'

export const StyleIcon = Brush

export interface StylePickerProps {
  button: (isLoading: boolean) => JSX.Element
}

export function StylePicker(props: StylePickerProps) {
  const [stylePickerIsOpen, setStylePickerIsOpen] = createSignal(false)

  const [showInitialStyleHint, initialStyleHintQuery] = createResource(
    async () => await client.showStylePrompt.query(),
  )

  async function dismissStylePrompt() {
    initialStyleHintQuery.mutate(false)
    await client.dismissStylePrompt.mutate()
  }

  const [filesWereChanged, setFilesWereChanged] = createSignal(false)

  // When the style picker is closed, and the files were changed, replace the styles.
  const [refreshQuery] = createResource(
    () => !stylePickerIsOpen() && filesWereChanged(),
    async () => {
      const result = await client.replaceStyles.mutate()
      if (result.type === 'error') {
        console.error(result.message)
      }
      flushHtmlPatches()
      setFilesWereChanged(false)
    },
  )

  function stylePickerIsLoading() {
    return refreshQuery.loading || stylesAreLoading()
  }

  // Permanently dismiss the style picker's popup when the user
  // opens the style picker for the first time.
  createEffect(() => {
    if (stylePickerIsOpen() && showInitialStyleHint()) {
      dismissStylePrompt()
    }
  })

  // For local dev testing: Un-dismiss the style prompt when the user presses the backtick key.
  // window.addEventListener('keydown', (event) => {
  //   if (event.key === '`') {
  //     client.unDismissStylePrompt.mutate()
  //   }
  // })

  return (
    <div class="relative">
      {/* Style picker initial hint popover */}
      <Popover
        open={showInitialStyleHint() && firstPatchReceived()}
      >
        <PopoverTrigger class="-z-50 absolute inset-0"><div /></PopoverTrigger>
        <PopoverContent class="w-48">
          <PopoverArrow />
          <div class="space-y-2">
            <div>You can use this <StyleIcon size={18} class="inline" /> button to enable CSS files.</div>
            <div class="w-full flex justify-end">
              <ui-test-visualizer-button
                onClick={dismissStylePrompt}
                appearance="secondary"
                title="Dismiss style prompt"
              >
                OK
              </ui-test-visualizer-button>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Style picker menu popover */}
      <Popover
        open={stylePickerIsOpen()}
        onOpenChange={open => setStylePickerIsOpen(open)}
      >
        <PopoverTrigger>{props.button(stylePickerIsLoading())}</PopoverTrigger>
        <PopoverContent>
          <PopoverArrow />
          <StylePickerMenu
            setFilesWereChanged={setFilesWereChanged}
            setStylePickerOpen={setStylePickerIsOpen}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}

interface StylePickerMenuProps {
  setStylePickerOpen: (val: boolean) => void
  setFilesWereChanged: (val: boolean) => void
}

function StylePickerMenu(
  props: StylePickerMenuProps,
) {
  const [files, fileQuery] = createResource(
    () => client.availableCssFiles.query(),
  )

  async function toggleFile(path: string, enabled: boolean) {
    const optimisticUpdate = files()
      ?.map(f => f.path === path ? { ...f, enabled } : f)
    fileQuery.mutate(optimisticUpdate)
    await client.toggleCssFile.mutate({ path, enabled })
    props.setFilesWereChanged(true)
  }

  async function addExternalFiles() {
    await client.addExternalCssFiles.mutate()
    props.setFilesWereChanged(true)
    fileQuery.refetch()
  }

  async function removeExternalFile(path: string) {
    await client.removeExternalCssFile.mutate(path)
    props.setFilesWereChanged(true)
    fileQuery.refetch()
  }

  function ok() {
    props.setStylePickerOpen(false)
  }

  return (
    <div class="flex flex-col gap-2 max-w-[300px]">
      <h1 class="font-bold text-sm text-center">Enable your styles</h1>
      <div class="">
        <Show when={files()?.length === 0}>
          <div>No CSS files found in workspace</div>
        </Show>
        <For each={files()}>
          {file => (
            <div class="flex gap-2">
              <label class="grow flex justify-between items-center px-2 select-none hover:bg-accent cursor-pointer">
                <div class="" title={file.path}>
                  {file.displayPath}
                </div>
                <ui-test-visualizer-checkbox
                  checked={file.enabled}
                  onChange={(e: unknown) => {
                    const checked = Boolean(get(e, 'currentTarget.checked'))
                    return toggleFile(file.path, checked)
                  }}
                />
              </label>
              <ui-test-visualizer-button
                appearance="icon"
                title="Remove"
                onClick={() => removeExternalFile(file.path)}
                style={{ visibility: file.isExternal ? 'visible' : 'hidden' }}
              >
                <X />
              </ui-test-visualizer-button>
            </div>
          )}
        </For>
        <Show when={files.loading}>
          <div>
            <ui-test-visualizer-progress-ring />
          </div>
        </Show>
      </div>
      <div class="flex justify-between px-2">
        <ui-test-visualizer-button
          appearance="secondary"
          title="Link another file"
          onClick={addExternalFiles}
        >
          Add external file
        </ui-test-visualizer-button>
        <ui-test-visualizer-button
          appearance="primary"
          title="Apply styles"
          onClick={ok}
        >
          OK
        </ui-test-visualizer-button>
      </div>
    </div>
  )
}
