import { Show, createEffect, createMemo, createSignal, onCleanup, onMount } from 'solid-js'
import { createStore, reconcile } from 'solid-js/store'
import { makeEventListener } from '@solid-primitives/event-listener'
import { createMutationObserver } from '@solid-primitives/mutation-observer'
import { ReactiveWeakMap } from '@solid-primitives/map'
import { shadowHost } from '../App'
import { type InspectedNode, getNewDomTree } from './inspector-dom-tree'
import { createInspectorSearch } from './inspector-search'
import { TreeNode } from './TreeNode'
import { SearchToolbar } from './SearchToolbar'
import { deepElementFromPoint } from './util'

export const search = createInspectorSearch()

export const disableHighlightAnimation = { val: true }

export function Inspector() {
  const [domTree, setDomTree] = createStore<{ tree: InspectedNode | null }>({ tree: getNewDomTree() })
  const [selectedNode, setSelectedNode] = createSignal<Node | null>(null)
  const [hoveredNode, setHoveredNode] = createSignal<Node | null>(null)
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
    const newNode = shadowHost.shadowRoot && deepElementFromPoint(shadowHost.shadowRoot, e.clientX, e.clientY)
    if (
      // Don't select the inspected UI's 'body' element
      (newNode?.closest('body') || (newNode?.getRootNode() instanceof ShadowRoot && newNode?.getRootNode() !== shadowHost.shadowRoot))
      // Ignore elements outside the tested UI e.g. the top toolbar
      && !document.body.contains(newNode)
      && newNode !== hoveredNode()
    ) {
      setHoveredNode(null) // Set to null first so there is no smooth animation when hovering with the mouse
      setHoveredNode(newNode)
    }
  })

  // select the element under the mouse
  makeEventListener(shadowHost, 'click', (e) => {
    e.preventDefault()
    e.stopPropagation()
    const el = shadowHost.shadowRoot && deepElementFromPoint(shadowHost.shadowRoot, e.clientX, e.clientY)
    setSelectedNode(el ?? null)
  })

  makeEventListener(shadowHost, 'mouseleave', () => setHoveredNode(null))

  // select and highlight the current element matching the search query
  createEffect(() => {
    if (search.matchedNodes().size > 0) {
      const el = [...search.matchedNodes()][search.currentNodeIndex()]
      setSelectedNode(el ?? null)
    }
  })

  makeEventListener(window, 'blur', () => setSelectedNode(null))

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
                  onHover={setHoveredNode}
                  collapsedStates={collapsedStates}
                  selectedNode={selectedNode()}
                  onSelect={setSelectedNode}
                />
              </div>
            </div>
          </div>
        )}
      </Show>
      <Show when={hoveredNode() ?? selectedNode()} keyed>
        {(node) => {
          function newRect() {
            return node instanceof Text
              ? (() => {
                  const range = document.createRange()
                  range.selectNodeContents(node)
                  return range.getBoundingClientRect()
                })()
              : node instanceof Element
                ? node.getBoundingClientRect()
                : node.parentElement?.getBoundingClientRect()
          }

          const [rect, setRect] = createSignal(newRect())

          // Update the rect on scroll, click, etc
          makeEventListener(window, 'resize', () => setRect(newRect()))
          makeEventListener(window, 'scroll', () => setRect(newRect()))
          makeEventListener(window, 'wheel', () => setRect(newRect()))
          makeEventListener(window, 'mousedown', () => setRect(newRect()))
          makeEventListener(window, 'mouseup', () => setRect(newRect()))
          makeEventListener(window, 'click', () => setRect(newRect()))

          return (
            <div
              class="fixed z-50 pointer-events-none bg-[var(--vscode-editorLightBulbAutoFix-foreground)] opacity-60 transition-all duration-100 min-h-[1px] min-w-[1px]"
              style={{
                top: `${rect()?.top}px`,
                left: `${rect()?.left}px`,
                width: `${rect()?.width}px`,
                height: `${rect()?.height}px`,
              }}
            />
          )
        }}
      </Show>
    </div>
  )
}
