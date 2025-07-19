import { Show, createSignal } from 'solid-js'
import { makeEventListener } from '@solid-primitives/event-listener'
import { ReactiveWeakMap } from '@solid-primitives/map'
import { shadowHost } from '../App'
import type { DOMTree } from './TreeNode'
import { TreeNode } from './TreeNode'

function parseDOMTree(node: Element): DOMTree {
  // Get all direct text nodes, excluding whitespace-only nodes
  const textNodes = Array.from(node.childNodes)
    .filter(child =>
      child.nodeType === Node.TEXT_NODE
      && child.textContent?.trim() !== '',
    )
    .map(node => node.textContent?.trim())
    .filter(Boolean)
    .join(' ')

  // Get all attributes
  const attributes = Array.from(node.attributes || [])
    .map(attr => ({ name: attr.name, value: attr.value }))

  return {
    tagName: node.tagName.toLowerCase(),
    childTrees: Array.from(node.children).map(child => parseDOMTree(child)),
    shadowTrees: node.shadowRoot ? Array.from(node.shadowRoot.children).map(child => parseDOMTree(child)) : null,
    textNodes,
    attributes,
    getBoundingClientRect: () => node.getBoundingClientRect(),
    node,
  }
}

export function Inspector() {
  function getNewDomTree() {
    const shadowRoot = shadowHost?.shadowRoot
    if (!shadowRoot) {
      return null
    }

    const tree = parseDOMTree(shadowRoot.querySelector('body')!)
    return tree
  }

  const [hoveredRect, setHoveredRect] = createSignal<DOMRect | null>(null)
  const [domTree, setDomTree] = createSignal<DOMTree | null>(getNewDomTree(), { equals: false })
  const collapsedStates = new ReactiveWeakMap<Element, boolean>()

  // Listen for the 'flushPatches' event (fired when the debugger steps to a new line),
  // and update the DOM tree
  makeEventListener(window, 'message', (event) => {
    if (event.data.flushPatches) {
      setDomTree(getNewDomTree())
    }
  })

  return (
    <>
      <div class="bg-[var(--vscode-editor-background)] text-[var(--vscode-editor-foreground)] h-full w-full overflow-scroll p-4">
        <Show when={domTree()} keyed={true}>
          {tree => (
            <TreeNode
              {...tree}
              onHover={setHoveredRect}
              collapsedStates={collapsedStates}
            />
          )}
        </Show>
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
    </>
  )
}
