import { For, createResource } from 'solid-js'
import '../index.css'
import { client } from '../lib/panel-client'
import { Checkbox } from './checkbox'
import { Button } from './button'

export function StylePicker() {
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

  return (
    <div class="flex flex-col gap-2 p-2 max-w-[300px]">
      <div class="flex justify-center">Link your styles</div>
      <div class="">
        <For each={files()} fallback={<div>Loading...</div>}>
          {file => (
            <label class="flex justify-between items-center select-none">
              <div>{file.displayPath}</div>
              <Checkbox
                checked={file.enabled}
                onChange={e => toggleFile(file.path, e)}
              />
            </label>
          )}
        </For>
        <Button
          variant="outline"
          onClick={addExternalFiles}
        >
          Link another file
        </Button>
      </div>
    </div>
  )
}
