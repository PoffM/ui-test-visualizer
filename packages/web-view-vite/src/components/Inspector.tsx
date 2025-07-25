import { Show, createSignal } from 'solid-js'
import { makeEventListener } from '@solid-primitives/event-listener'
import { ReactiveWeakMap } from '@solid-primitives/map'
import { shadowHost } from '../App'
import { type DOMTree, getNewDomTree } from '../lib/inspector-dom-tree'
import { TreeNode } from './TreeNode'

export function Inspector() {
  const [hoveredRect, setHoveredRect] = createSignal<DOMRect | null>(null)
  const [domTree, setDomTree] = createSignal<DOMTree | null>(getNewDomTree(null), { equals: false })
  const [selectedElement, setSelectedElement] = createSignal<Element | null>(null)
  const collapsedStates = new ReactiveWeakMap<Element, boolean>()

  // Listen for the 'flushPatches' event (fired when the debugger steps to a new line),
  // and update the DOM tree
  makeEventListener(window, 'message', (event) => {
    if (event.data.flushPatches) {
      setDomTree(prev => getNewDomTree(prev))
    }
  })

  // highlight the element under the mouse
  makeEventListener(shadowHost, 'mousemove', (e) => {
    const el = shadowHost?.shadowRoot?.elementFromPoint(e.clientX, e.clientY)
    setHoveredRect(el?.getBoundingClientRect() ?? null)
  })

  // select the element under the mouse
  makeEventListener(shadowHost, 'click', (e) => {
    e.preventDefault()
    e.stopPropagation()
    const el = shadowHost?.shadowRoot?.elementFromPoint(e.clientX, e.clientY)
    setSelectedElement(el ?? null)
  })

  return (
    <div class="h-full w-full flex flex-col">
      <div class="bg-[var(--vscode-panel-background)] text-[var(--vscode-panel-foreground)] h-full w-full overflow-scroll pt-4 pb-4">
        <div class="font-(family-name:--theme-font-family) font-(--theme-font-weight) text-(length:--theme-font-size) leading-(--theme-line-height)">
          <Show when={domTree()} keyed={true}>
            {tree => (
              <TreeNode
                {...tree}
                onHover={setHoveredRect}
                collapsedStates={collapsedStates}
                selectedNode={selectedElement()}
                onSelect={setSelectedElement}
              />
            )}
          </Show>
        </div>
      </div>
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
