import { makeEventListener } from '@solid-primitives/event-listener'
import type { HTMLPatch } from 'replicate-dom'
import { applyDomPatch, parseDomNode } from 'replicate-dom'
import { createEffect, createResource, createSignal, onCleanup } from 'solid-js'
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

  function flushHtmlPatches() {
    for (const patch of patches) {
      applyDomPatch(
        shadow,
        patch,
        window,
      )
    }
    patches = []
  }

  makeEventListener(window, 'message', (event) => {
    const { htmlPatch, flushPatches } = event.data

    if (htmlPatch) {
      patches.push(htmlPatch as HTMLPatch)
      setFirstPatchReceived(true)
    }
    if (flushPatches) {
      flushHtmlPatches()
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

    setReplicaHtmlEl(htmlEl)
  }

  // The user-selected style element is added as an empty style tag,
  // so here we fetch the transformed CSS
  const [stylesToLoad, setStylesToLoad] = createSignal<HTMLStyleElement[] | null>(null)
  // When "stylesToLoad" changes, this async function runs and provides a 'loading' signal
  const [styleLoader] = createResource(stylesToLoad, async (nodes) => {
    for (const node of nodes) {
      const src_filepath = node.dataset.src_filepath
      if (src_filepath) {
        const css = await client.loadTransformedCss.query(src_filepath)
        node.textContent = css
      }
    }
  })

  const [head, setHead] = createSignal(shadow.querySelector('head')!)

  // Observe the head for style changes. THe head is a signal that changes when the user clicks the refresh button.
  createEffect(() => {
    const styleObserver = new MutationObserver((mutationsList) => {
      const nodes: HTMLStyleElement[] = []
      for (const mutation of mutationsList) {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          for (const addedNode of mutation.addedNodes) {
            if (addedNode instanceof HTMLStyleElement && addedNode.tagName === 'STYLE') {
              const src_filepath = addedNode.dataset.src_filepath
              if (src_filepath) {
                nodes.push(addedNode)
              }
            }
          }
        }
      }
      setStylesToLoad(nodes)
    })
    styleObserver.observe(head(), {
      childList: true,
      subtree: true,
    })
    onCleanup(() => styleObserver.disconnect())
  })

  const stylesAreLoading = () => styleLoader.loading

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

    const styleNodes = Array.from(shadow.querySelectorAll('head>style[data-debug_replaceable]'))
      .filter(it => it instanceof HTMLStyleElement)
    setStylesToLoad(styleNodes)

    setHead(shadow.querySelector('head')!)
  }

  return {
    shadowHost,
    refreshShadow,
    firstPatchReceived,
    flushHtmlPatches,
    stylesAreLoading,
  }
}
