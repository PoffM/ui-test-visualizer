import { makeEventListener } from '@solid-primitives/event-listener'
import type { HTMLPatch } from 'replicate-dom'
import { applyDomPatch, parseDomNode } from 'replicate-dom'
import { createSignal } from 'solid-js'
import { setReplicaHtmlEl } from '../App'
import { client } from './panel-client'

export function createDomReplica() {
  const [firstPatchReceived, setFirstPatchReceived] = createSignal(false)

  const shadowHost = document.createElement('div')
  shadowHost.classList.add('h-full', 'w-full', 'dom-replica-container')

  const shadow = shadowHost.attachShadow({ mode: 'open' })
  initShadowContent(
    shadow,
    new DOMParser().parseFromString(
      `<html><head></head><body></body></html>`,
      'text/html',
    ).children[0]!,
  )

  let patches: HTMLPatch[] = []

  makeEventListener(window, 'message', (event) => {
    const { htmlPatch, flushPatches } = event.data

    if (htmlPatch) {
      patches.push(htmlPatch as HTMLPatch)
      setFirstPatchReceived(true)
    }
    if (flushPatches) {
      for (const patch of patches) {
        applyDomPatch(
          shadow,
          patch,
          window,
        )
      }
      patches = []
    }
  })

  function initShadowContent(shadow: DocumentFragment, content: Node) {
    shadow.replaceChildren(content)
    const htmlEl = shadow.querySelector('html')!
    htmlEl.style.height = '100%'
    htmlEl.style.overflowY = 'scroll'

    // This should cause any position: fixed elements to be positioned relative to the shadow root
    // instead of overlapping the UI outside the shadow (i.e. the toolbar)
    htmlEl.style.transform = 'scale(1)'

    // Add extra padding to the bottom because the toolbar reduces the scrollable height,
    // cutting off the bottom of tall UIs
    htmlEl.style.paddingBottom = '80px'

    setReplicaHtmlEl(htmlEl)
  }

  async function refreshShadow() {
    const newHtml = await client.serializeHtml.query()

    const parsed = parseDomNode(
      // @ts-expect-error weird issue with the debugger output, you need to JSON.parse twice
      JSON.parse(JSON.parse(newHtml)),
      document,
      window,
    )

    // Show a blank page for a split second to show that the refresh is happening
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
