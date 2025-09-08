import get from 'lodash/get'
import Brush from 'lucide-solid/icons/brush'
import X from 'lucide-solid/icons/x'
import Folder from 'lucide-solid/icons/folder'
import type { JSX } from 'solid-js'
import { For, Show, createEffect, createMemo, createResource, createSignal } from 'solid-js'
import type { inferProcedureOutput } from '@trpc/server'
import debounce from 'lodash/debounce'
import { firstPatchReceived, flushHtmlPatches, stylesAreLoading } from '../App'
import '../index.css'
import { client } from '../lib/panel-client'
import type { PanelRouter } from '../../../extension/src/panel-controller/panel-router'
import { Popover, PopoverArrow, PopoverContent, PopoverTrigger } from './solid-ui/popover'

export const StyleIcon = Brush

export interface StylePickerProps {
  button: (isLoading: boolean) => JSX.Element
}

/**
 * Triggers a call to the extension process to provide the new transformed CSS code to the WebView
 */
export function notifyForStyleChange() {
  setStylesWereChanged(true)
}

const [stylesWereChanged, setStylesWereChanged] = createSignal(false)

export function StylePicker(props: StylePickerProps) {
  const [stylePickerIsOpen, setStylePickerIsOpen] = createSignal(false)

  const [showInitialStyleHint, initialStyleHintQuery] = createResource(
    async () => await client.showStylePrompt.query(),
  )

  async function dismissStylePrompt() {
    initialStyleHintQuery.mutate(false)
    await client.dismissStylePrompt.mutate()
  }

  // When the style picker is closed, and the files were changed, replace the styles.
  const [refreshQuery] = createResource(
    () => !stylePickerIsOpen() && stylesWereChanged(),
    async () => {
      const result = await client.replaceStyles.mutate()
      if (result.type === 'error') {
        console.error(result.message)
      }
      flushHtmlPatches()
      setStylesWereChanged(false)
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
        <PopoverContent>
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
        <PopoverContent class="w-[500px]">
          <PopoverArrow />
          <StylePickerMenu
            setStylePickerOpen={setStylePickerIsOpen}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}

interface StylePickerMenuProps {
  setStylePickerOpen: (val: boolean) => void
}

function StylePickerMenu(
  props: StylePickerMenuProps,
) {
  const [files, fileQuery] = createResource(
    () => client.availableCssFiles.query(),
  )

  const [searchTerm, setSearchTerm] = createSignal('')

  const filteredFiles = createMemo(() => {
    return files()?.filter(file => file.displayPath.toLowerCase().includes(searchTerm().toLowerCase()))
  })

  const groupedFiles = createMemo(() => groupFilesByDirectory(filteredFiles() ?? []))

  const enabledFiles = createMemo(() => {
    return files()?.filter(file => file.enabled) ?? []
  })

  async function toggleFile(path: string, enabled: boolean) {
    const optimisticUpdate = files()
      ?.map(f => f.path === path ? { ...f, enabled } : f)
    fileQuery.mutate(optimisticUpdate)
    await client.toggleCssFile.mutate({ path, enabled })
    notifyForStyleChange()
  }

  async function disableAllFiles() {
    const optimisticUpdate = files()?.map(f => ({ ...f, enabled: false }))
    fileQuery.mutate(optimisticUpdate)
    await client.disableAllCssFiles.mutate()
    notifyForStyleChange()
  }

  async function addExternalFiles() {
    await client.addExternalCssFiles.mutate()
    notifyForStyleChange()
    fileQuery.refetch()
  }

  async function removeExternalFile(path: string) {
    await client.removeExternalCssFile.mutate(path)
    notifyForStyleChange()
    fileQuery.refetch()
  }

  function confirmStyles() {
    props.setStylePickerOpen(false)
  }

  const search = debounce((term: string) => {
    setSearchTerm(term)
  }, 200)

  return (
    <div class="flex flex-col gap-2">
      <h1 class="font-bold text-lg">Enable your styles</h1>
      <div class="flex items-center justify-between">
        <ui-test-visualizer-text-field
          autoFocus
          placeholder="Search CSS files"
          onInput={(e: Event & { currentTarget: HTMLInputElement }) => {
            search(e.currentTarget.value)
          }}
        />
        <div
          class="flex gap-2"
          style={{ visibility: (files()?.filter(file => file.enabled)?.length ?? 0) > 0 ? 'visible' : 'hidden' }}
        >
          <div class="flex items-center">
            {enabledFiles().length} style{enabledFiles().length > 1 ? 's' : ''} enabled
          </div>
          <ui-test-visualizer-button
            appearance="secondary"
            onClick={disableAllFiles}
          >
            <X class="h-4 w-4" />
            Disable All
          </ui-test-visualizer-button>
        </div>
      </div>
      <div class="overflow-y-auto max-h-[400px] pb-4">
        <div class="w-fit min-w-full">
          <div class="space-y-2">
            <Show when={filteredFiles()?.length === 0}>
              <div>No CSS files found in workspace</div>
            </Show>
            <For each={Object.entries(groupedFiles())}>{([directory, files]) => (
              <div class="w-full space-y-1 pr-2">
                <div class="flex items-start space-x-2 py-1 border-b border-border">
                  <Folder class="h-4 w-4 shrink-0 mt-[1px] opacity-90" />
                  <span class="text-sm font-medium font-mono opacity-90">
                    {directory
                      ? directory.split('/').map((part, i) => (
                        <>
                          {i > 0 && <>/<wbr /></>}
                          {part}
                        </>
                      ))
                      : 'Project Root'}
                  </span>
                </div>
                <div class="ml-6">
                  <For each={files}>
                    {(file) => {
                      const filename = file.displayPath.split('/').pop() || file.displayPath
                      return (
                        <label class="px-2 py-1 flex items-center gap-3 cursor-pointer select-none hover:bg-accent">
                          <div class="flex gap-2 items-start">
                            <ui-test-visualizer-checkbox
                              class="mt-[2px]"
                              checked={file.enabled}
                              onChange={(e: unknown) => {
                                const checked = Boolean(get(e, 'currentTarget.checked'))
                                return toggleFile(file.path, checked)
                              }}
                            />
                            <div class="text-sm leading-relaxed flex-1 min-w-0">
                              <div class="flex items-center space-x-2">
                                <span class="font-medium break-all" title={file.path}>
                                  {filename}
                                </span>
                              </div>
                            </div>
                            <Show when={file.isExternal}>
                              <ui-test-visualizer-button
                                appearance="icon"
                                title="Remove"
                                onClick={(e: MouseEvent) => {
                                  console.log('clicked remove button')
                                  e.stopPropagation()
                                  e.preventDefault()
                                  removeExternalFile(file.path)
                                }}
                              >
                                <X />
                              </ui-test-visualizer-button>
                            </Show>
                          </div>
                        </label>
                      )
                    }}
                  </For>
                </div>
              </div>
            )}
            </For>
            <Show when={files.loading}>
              <div>
                <ui-test-visualizer-progress-ring />
              </div>
            </Show>
          </div>

        </div>
      </div>
      <div class="flex gap-8 px-2 pt-2">
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
          onClick={confirmStyles}
        >
          <span class="w-10 flex items-center justify-center">
            OK
          </span>
        </ui-test-visualizer-button>
      </div>
    </div>
  )
}

type CssFile = inferProcedureOutput<PanelRouter['availableCssFiles']>[number]

function groupFilesByDirectory(files: CssFile[]) {
  const groups: { [key: string]: CssFile[] } = {}

  for (const file of files) {
    let directory = file.displayPath.split('/').slice(0, -1).join('/')
    if (file.displayPath.startsWith('/')) {
      directory = `/${directory}`
    }

    if (!groups[directory]) {
      groups[directory] = []
    }
    groups[directory]?.push(file)
  }

  // Sort directories and files within each directory
  const sortedGroups = Object.keys(groups)
    .sort()
    .reduce(
      (acc, key) => {
        acc[key] = groups[key]?.sort() ?? []
        return acc
      },
      {} as { [key: string]: CssFile[] },
    )

  return sortedGroups
}
