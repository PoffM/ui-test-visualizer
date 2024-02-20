import { makeEventListener } from '@solid-primitives/event-listener'
import * as webviewToolkit from '@vscode/webview-ui-toolkit'
import { Moon, Sun } from 'lucide-solid'
import { createSignal } from 'solid-js'
import { render } from 'solid-js/web'
import type { HTMLPatch } from 'replicate-dom'
import { applyDomPatch } from 'replicate-dom'
import shadowCSSText from './assets/shadow.css?raw'
import { createColorTheme } from './lib/color-theme'
import { vscode } from './lib/vscode'

// Importing the router type from the server file

// In order to use the Webview UI Toolkit web components they
// must be registered with the browser (i.e. webview) using the
// syntax below.
webviewToolkit
  .provideVSCodeDesignSystem()
  .register(webviewToolkit.vsCodeButton())

export function App() {
  const [firstPatchReceived, setFirstPatchReceived] = createSignal(false)

  const controls = document.createElement('div')

  async function initShadow(host: HTMLDivElement) {
    const shadow = host.attachShadow({ mode: 'open' })
    shadow.appendChild(
      new DOMParser().parseFromString(
        `<html style="height: 100%; overflow-y: scroll;"><head></head><body></body></html>`,
        'text/html',
      ).children[0]!,
    )

    const shadowStyle = document.createElement('style')
    shadowStyle.textContent = shadowCSSText
    shadow.children[0]!.children[0]!.appendChild(shadowStyle)

    const [theme, toggleTheme] = createColorTheme(
      shadow.children[0] as HTMLHtmlElement,
    )

    render(
      () => (
        <div class="flex ">
          <vscode-button
            class="h-10 w-10"
            appearance="secondary"
            onClick={toggleTheme}
            title={`Switch to ${theme() === 'dark' ? 'light' : 'dark'} mode.`}
          >
            {theme() === 'dark' ? <Moon /> : <Sun />}
          </vscode-button>
        </div>
      ),
      controls,
    )

    makeEventListener(window, 'message', (event) => {
      const { htmlPatch } = event.data

      if (htmlPatch) {
        setFirstPatchReceived(true)
        applyDomPatch(
          shadow,
          (event.data.htmlPatch as HTMLPatch),
          window,
        )
      }
    })
  }

  function refreshHtml() {
    vscode.postMessage('refresh')
  }

  return (
    <div class="fixed inset-0">
      <div class="h-[30px]">
        <vscode-button
          appearance="secondary"
          onClick={refreshHtml}
        >
          Refresh
        </vscode-button>
      </div>
      <div class="relative h-full w-full">
        <div
          style={{ visibility: firstPatchReceived() ? 'hidden' : 'visible' }}
          class="absolute h-full w-full flex justify-center items-center"
        >
          Listening for test DOM mutations...
        </div>
        <div
          style={{ visibility: firstPatchReceived() ? 'visible' : 'hidden' }}
          class="absolute h-full w-full"
        >
          <div class="h-full w-full" ref={initShadow} />
        </div>
      </div>
      <div class="fixed bottom-0 p-4 flex flex-col justify-end">{controls}</div>
    </div>
  )
}
