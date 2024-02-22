import { For, createResource } from 'solid-js'
import '../index.css'
import get from 'lodash/get'
import { X } from 'lucide-solid'
import { client } from '../lib/panel-client'

export interface StylePickerProps {
  onOkClick: () => void
}

export function StylePicker(props: StylePickerProps) {
  const [files, fileQuery] = createResource(
    () => client.availableCssFiles.query(),
  )

  async function toggleFile(path: string, enabled: boolean) {
    const optimisticUpdate = files()
      ?.map(f => f.path === path ? { ...f, enabled } : f)
    fileQuery.mutate(optimisticUpdate)
    await client.toggleCssFile.mutate({ path, enabled })
  }

  async function addExternalFiles() {
    await client.addExternalCssFiles.mutate()
    fileQuery.refetch()
  }

  async function removeExternalFile(path: string) {
    await client.removeExternalCssFile.mutate(path)
    fileQuery.refetch()
  }

  function ok() {
    props.onOkClick()
  }

  return (
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
          title="Link another file"
          onClick={ok}
        >
          OK
        </vscode-button>
      </div>
    </div>
  )
}
