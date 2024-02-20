import { makeEventListener } from '@solid-primitives/event-listener'
import * as webviewToolkit from '@vscode/webview-ui-toolkit'
import { Moon, Sun } from 'lucide-solid'
import { createSignal } from 'solid-js'
import { render } from 'solid-js/web'
import type { HTMLPatch } from 'replicate-dom'
import { applyDomPatch, parseDomNode } from 'replicate-dom'
import uniqueId from 'lodash/uniqueId'
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

  const [htmlEl, setHtmlEl] = createSignal<HTMLHtmlElement>()

  const controls = document.createElement('div')

  function initShadowContent(shadow: DocumentFragment, content: Node) {
    shadow.replaceChildren(content)
    const htmlEl = shadow.querySelector('html')!
    htmlEl.style.height = '100%'
    htmlEl.style.overflowY = 'scroll'
    setHtmlEl(htmlEl)

    const shadowStyle = document.createElement('style')
    shadowStyle.textContent = shadowCSSText
    shadow.children[0]!.children[0]!.appendChild(shadowStyle)
  }

  async function initShadow(host: HTMLDivElement) {
    const shadow = host.attachShadow({ mode: 'open' })
    initShadowContent(
      shadow,
      new DOMParser().parseFromString(
        `<html><head></head><body></body></html>`,
        'text/html',
      ).children[0]!,
    )

    const [theme, toggleTheme] = createColorTheme(
      htmlEl,
    )

    async function refreshShadow() {
      const token = uniqueId()

      vscode.postMessage({ cmd: 'refresh', token })

      const newHtml = await new Promise<string>((resolve) => {
        const dispose = makeEventListener(window, 'message', (event) => {
          if (event.data.token === token) {
            dispose()
            resolve(event.data.html)
          }
        })
      })

      const parsed = parseDomNode(
        JSON.parse(JSON.parse(newHtml)),
        document,
        window,
      )

      // Show a blank for a split second to show that the refresh is happening
      shadow.querySelector('html body')?.remove()
      await new Promise(res => setTimeout(res, 40))
      // Then insert the refreshed content
      initShadowContent(shadow, parsed)
    }

    render(
      () => (
        <div
          class="flex gap-2 p-2"
          style={{ visibility: firstPatchReceived() ? 'visible' : 'hidden' }}
        >
          <vscode-button
            appearance="secondary"
            onClick={refreshShadow}
          >
            Refresh
          </vscode-button>
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

  return (
    <div class="fixed inset-0">
      {controls}
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
    </div>
  )
}
