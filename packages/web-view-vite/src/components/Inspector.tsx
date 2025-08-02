import { Show, createEffect, createSignal } from 'solid-js'
import { createStore, reconcile } from 'solid-js/store'
import { makeEventListener } from '@solid-primitives/event-listener'
import { createMutationObserver } from '@solid-primitives/mutation-observer'
import { ReactiveWeakMap } from '@solid-primitives/map'
import { shadowHost } from '../App'
import { type DOMTree, getNewDomTree } from '../lib/inspector-dom-tree'
import { createInspectorSearch } from '../lib/inspector-search'
import { TreeNode } from './TreeNode'
import { SearchToolbar } from './SearchToolbar'

export const search = createInspectorSearch()

export function Inspector() {
  const [hoveredRect, setHoveredRect] = createSignal<DOMRect | null>(null)
  const [domTree, setDomTree] = createStore<{ tree: DOMTree | null }>({ tree: getNewDomTree() })
  const [selectedElement, setSelectedElement] = createSignal<Element | null>(null)
  const collapsedStates = new ReactiveWeakMap<Element, boolean>()

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
    const el = shadowHost.shadowRoot?.elementFromPoint(e.clientX, e.clientY)
    if (el?.closest('body')) {
      setHoveredRect(el?.getBoundingClientRect() ?? null)
    }
  })

  // select the element under the mouse
  makeEventListener(shadowHost, 'click', (e) => {
    e.preventDefault()
    e.stopPropagation()
    const el = shadowHost.shadowRoot?.elementFromPoint(e.clientX, e.clientY)
    setSelectedElement(el ?? null)
  })

  // select and highlight the current element matching the search query
  createEffect(() => {
    if (search.matchedNodes().length > 0) {
      const el = search.matchedNodes()[search.currentNodeIndex()]
      if (el) {
        setSelectedElement(el)
        setHoveredRect(el.getBoundingClientRect())
      }
    }
  })

  return (
    <div class="h-full w-full flex flex-col">
      <Show when={domTree.tree} keyed={true}>
        {tree => (
          <>
            <SearchToolbar tree={tree} />
            <div class="bg-(--vscode-panel-background) text-(--vscode-panel-foreground) h-full w-full overflow-scroll pt-2 pb-4">
              <div class="font-[consolas]">
                <TreeNode
                  treeNode={tree}
                  onHover={setHoveredRect}
                  collapsedStates={collapsedStates}
                  selectedNode={selectedElement()}
                  onSelect={setSelectedElement}
                />
              </div>
            </div>
          </>
        )}
      </Show>
      {hoveredRect() && (
        <div
          class="fixed pointer-events-none bg-[var(--vscode-editorLightBulbAutoFix-foreground)] opacity-60 transition-all duration-100 z-50"
          style={{
            top: `${hoveredRect()!.top}px`,
            left: `${hoveredRect()!.left}px`,
            width: `${hoveredRect()!.width}px`,
            height: `${hoveredRect()!.height}px`,
          }}
        />
      )}
    </div>
  )
}
