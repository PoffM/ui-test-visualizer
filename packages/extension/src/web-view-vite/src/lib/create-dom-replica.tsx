import { makeEventListener } from '@solid-primitives/event-listener'
import type { HTMLPatch } from 'replicate-dom'
import { applyDomPatch, parseDomNode } from 'replicate-dom'
import uniqueId from 'lodash/uniqueId'
import { createSignal } from 'solid-js'
import { setReplicaHtmlEl } from '../App'
import shadowCSSText from '../assets/shadow.css?raw'
import { vscode } from './vscode'

export function createDomReplica() {
  const [firstPatchReceived, setFirstPatchReceived] = createSignal(false)

  const shadowHost = document.createElement('div')
  shadowHost.classList.add('h-full', 'w-full')

  const shadow = shadowHost.attachShadow({ mode: 'open' })
  initShadowContent(
    shadow,
    new DOMParser().parseFromString(
      `<html><head></head><body></body></html>`,
      'text/html',
    ).children[0]!,
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

  function initShadowContent(shadow: DocumentFragment, content: Node) {
    shadow.replaceChildren(content)
    const htmlEl = shadow.querySelector('html')!
    htmlEl.style.height = '100%'
    htmlEl.style.overflowY = 'scroll'
    setReplicaHtmlEl(htmlEl)

    const shadowStyle = document.createElement('style')
    shadowStyle.textContent = shadowCSSText
    shadow.children[0]!.children[0]!.appendChild(shadowStyle)
  }

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

  return {
    shadowHost,
    refreshShadow,
    firstPatchReceived,
  }
}
