export interface HotReloadParams {
  currentFile: string
  exportName: string
  watchOptions: [string, { ignored: string }]
  onReload: (newExport: unknown) => void
}

export async function hotReload({
  currentFile,
  exportName,
  onReload,
  watchOptions,
}: HotReloadParams) {
  const { watch } = await import('chokidar')
  const { default: debounce } = await import('lodash/debounce')

  const debouncedReload = debounce(() => {
    delete require.cache[currentFile]
    // eslint-disable-next-line ts/no-require-imports, ts/no-var-requires
    const newExport = require(currentFile)[exportName]
    onReload(newExport)
    console.log(`Reloaded ${exportName}`)
  }, 100)

  watch(...watchOptions).on('all', () => debouncedReload())
}
