import { Show, createEffect, createSignal, onCleanup, onMount } from 'solid-js'
import { createStore, reconcile } from 'solid-js/store'
import { makeEventListener } from '@solid-primitives/event-listener'
import { createMutationObserver } from '@solid-primitives/mutation-observer'
import { ReactiveWeakMap } from '@solid-primitives/map'
import { shadowHost } from '../App'
import { type InspectedNode, getNewDomTree } from './inspector-dom-tree'
import { createInspectorSearch } from './inspector-search'
import { TreeNode } from './TreeNode'
import { SearchToolbar } from './SearchToolbar'
import { deepElementFromPoint, makeMouseEnterAndLeaveListeners } from './util'

export const search = createInspectorSearch()

export const disableHighlightAnimation = { val: true }

export function Inspector() {
  const [hoveredRect, setHoveredRect] = createSignal<DOMRect | null>(null)
  const [domTree, setDomTree] = createStore<{ tree: InspectedNode | null }>({ tree: getNewDomTree() })
  const [selectedNode, setSelectedNode] = createSignal<Node | null>(null)
  const collapsedStates = new ReactiveWeakMap<Node, boolean>()

  // Update the DOM tree to reflect DOM changes when:
  // The 'flushPatches' event is fired (when the debugger steps to a new line),
  // Or the shadow root itself updates (e.g. on Refresh button clicked)
  {
    function updateDomTree() {
      setDomTree(reconcile({ tree: getNewDomTree() }, { key: 'node' }))
    }
    makeEventListener(window, 'message', (event) => {
      if (event.data.flushPatches) {
        updateDomTree()
      }
    })
    createMutationObserver(
      () => [shadowHost.shadowRoot].filter(Boolean),
      { childList: true },
      updateDomTree,
    )
  }

  // highlight the element under the mouse
  makeEventListener(shadowHost, 'mousemove', (e) => {
    const el = shadowHost.shadowRoot && deepElementFromPoint(shadowHost.shadowRoot, e.clientX, e.clientY)
    if (
      // Don't select the inspected UI's 'body' element
      (el?.closest('body') || (el?.getRootNode() instanceof ShadowRoot && el?.getRootNode() !== shadowHost.shadowRoot))
      // Ignore elements outside the tested UI e.g. the top toolbar
      && !document.body.contains(el)
    ) {
      setHoveredRect(null) // Set to null first so there is no smooth animation when hovering with the mouse
      setHoveredRect(el?.getBoundingClientRect() ?? null)
    }
  })

  // select the element under the mouse
  makeEventListener(shadowHost, 'click', (e) => {
    e.preventDefault()
    e.stopPropagation()
    const el = shadowHost.shadowRoot && deepElementFromPoint(shadowHost.shadowRoot, e.clientX, e.clientY)
    setSelectedNode(el ?? null)
  })

  makeMouseEnterAndLeaveListeners(
    shadowHost,
    () => {},
    () => {
      setHoveredRect(null)
    },
  )

  // select and highlight the current element matching the search query
  createEffect(() => {
    if (search.matchedNodes().size > 0) {
      const el = [...search.matchedNodes()][search.currentNodeIndex()]
      setSelectedNode(el ?? null)
      if (el) {
        setHoveredRect(
          el instanceof Element
            ? el.getBoundingClientRect()
            : el instanceof Text
              ? el.parentElement?.getBoundingClientRect() ?? null
              : null,
        )
      }
    }
  })

  // Track whether the inspector is mounted; used for the update highlight animation
  disableHighlightAnimation.val = true
  onMount(() => (disableHighlightAnimation.val = false))
  onCleanup(() => (disableHighlightAnimation.val = true))

  return (
    <div class="h-full w-full">
      <Show when={domTree.tree} keyed={true}>
        {tree => (
          <div class="relative z-60 h-full w-full flex flex-col bg-(--vscode-panel-background)">
            <SearchToolbar tree={tree} />
            <div
              class="text-(--vscode-panel-foreground) h-full w-full overflow-scroll pt-2 pb-4 pl-1"
              data-testid="Inspector scroll container"
            >
              <div class="font-[consolas]">
                <TreeNode
                  node={tree}
                  onHover={setHoveredRect}
                  collapsedStates={collapsedStates}
                  selectedNode={selectedNode()}
                  onSelect={setSelectedNode}
                />
              </div>
            </div>
          </div>
        )}
      </Show>
      <Show when={hoveredRect()}>
        {rect => (
          <div
            class="fixed z-50 pointer-events-none bg-[var(--vscode-editorLightBulbAutoFix-foreground)] opacity-60 transition-all duration-100 min-h-[1px] min-w-[1px]"
            style={{
              top: `${rect().top}px`,
              left: `${rect().left}px`,
              width: `${rect().width}px`,
              height: `${rect().height}px`,
            }}
          />
        )}
      </Show>
    </div>
  )
}
