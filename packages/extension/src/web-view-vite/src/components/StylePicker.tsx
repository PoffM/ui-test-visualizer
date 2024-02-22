import type { JSX } from 'solid-js'
import { For, createEffect, createResource, createSignal } from 'solid-js'
import '../index.css'
import get from 'lodash/get'
import { X } from 'lucide-solid'
import { client } from '../lib/panel-client'
import { Popover, PopoverContent, PopoverTrigger } from './popover'

export interface StylePickerProps {
  button: JSX.Element
}

export function StylePicker(props: StylePickerProps) {
  const [stylePickerOpen, setStylePickerOpen] = createSignal(false)

  const [files, fileQuery] = createResource(
    stylePickerOpen,
    isOpen => isOpen ? client.availableCssFiles.query() : undefined,
  )

  const [filesWereChanged, setFilesWereChanged] = createSignal(false)

  // When the style picker is closed, and the files were changed, replace the styles.
  createEffect(async () => {
    if (!stylePickerOpen() && filesWereChanged()) {
      await client.replaceStyles.mutate()
      setFilesWereChanged(false)
    }
  })

  async function toggleFile(path: string, enabled: boolean) {
    const optimisticUpdate = files()
      ?.map(f => f.path === path ? { ...f, enabled } : f)
    fileQuery.mutate(optimisticUpdate)
    await client.toggleCssFile.mutate({ path, enabled })
    setFilesWereChanged(true)
  }

  async function addExternalFiles() {
    await client.addExternalCssFiles.mutate()
    setFilesWereChanged(true)
    fileQuery.refetch()
  }

  async function removeExternalFile(path: string) {
    await client.removeExternalCssFile.mutate(path)
    setFilesWereChanged(true)
    fileQuery.refetch()
  }

  function ok() {
    setStylePickerOpen(false)
  }

  return (
    <Popover
      open={stylePickerOpen()}
      onOpenChange={open => setStylePickerOpen(open)}
    >
      <PopoverTrigger>{props.button}</PopoverTrigger>
      <PopoverContent>
        <div class="flex flex-col gap-2 max-w-[300px]">
          <h1 class="font-bold text-sm text-center">Enable your styles</h1>
          <div class="">
            <For each={files()} fallback={<div>Loading...</div>}>
              {file => (
                <div class="flex gap-2">
                  <label class="grow flex justify-between items-center px-2 select-none hover:bg-accent cursor-pointer">
                    <div class="" title={file.path}>
                      {file.displayPath}
                    </div>
                    <vscode-checkbox
                      checked={file.enabled}
                      onChange={(e: unknown) => {
                        const checked = Boolean(get(e, 'currentTarget.checked'))
                        return toggleFile(file.path, checked)
                      }}
                    />
                  </label>
                  <vscode-button
                    appearance="icon"
                    title="Remove"
                    onClick={() => removeExternalFile(file.path)}
                    style={{ visibility: file.isExternal ? 'visible' : 'hidden' }}
                  >
                    <X />
                  </vscode-button>
                </div>
              )}
            </For>
          </div>
          <div class="flex justify-between px-2">
            <vscode-button
              appearance="secondary"
              title="Link another file"
              onClick={addExternalFiles}
            >
              Add external file
            </vscode-button>
            <vscode-button
              appearance="primary"
              title="Apply styles"
              onClick={ok}
            >
              OK
            </vscode-button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
