import { Show, createSignal } from 'solid-js'
import { makeEventListener } from '@solid-primitives/event-listener'
import { ReactiveWeakMap } from '@solid-primitives/map'
import isEqual from 'lodash/isEqual'
import { shadowHost } from '../App'
import type { DOMTree } from './TreeNode'
import { TreeNode } from './TreeNode'

function parseDOMTree(node: Element, previousTree: DOMTree | null): DOMTree {
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

  const childTrees = Array.from(node.children)
    .map((child, idx) => parseDOMTree(child, previousTree?.childTrees?.[idx] ?? null))
  const shadowTrees = node.shadowRoot
    ? Array.from(node.shadowRoot.children).map((child, idx) => parseDOMTree(child, previousTree?.shadowTrees?.[idx] ?? null))
    : null

  let isChanged = !!previousTree && !isEqual(previousTree, {
    childTrees,
    shadowTrees,
    textNodes,
    attributes,
  })

  return {
    tagName: node.tagName.toLowerCase(),
    childTrees,
    shadowTrees,
    textNodes,
    attributes,
    node,
    isChanged: () => {
      const changed = isChanged
      isChanged = false
      return changed
    },
    getBoundingClientRect: () => node.getBoundingClientRect(),
  }
}

function getNewDomTree(previousTree: DOMTree | null) {
  const shadowRoot = shadowHost?.shadowRoot
  if (!shadowRoot) {
    return null
  }

  const tree = parseDOMTree(shadowRoot.querySelector('body')!, previousTree)
  return tree
}

export function Inspector() {
  const [hoveredRect, setHoveredRect] = createSignal<DOMRect | null>(null)
  const [domTree, setDomTree] = createSignal<DOMTree | null>(getNewDomTree(null), { equals: false })
  const collapsedStates = new ReactiveWeakMap<Element, boolean>()

  // Listen for the 'flushPatches' event (fired when the debugger steps to a new line),
  // and update the DOM tree
  makeEventListener(window, 'message', (event) => {
    if (event.data.flushPatches) {
      setDomTree(prev => getNewDomTree(prev))
    }
  })

  return (
    <>
      <div class="bg-[var(--vscode-panel-background)] text-[var(--vscode-panel-foreground)] h-full w-full overflow-scroll pt-4 pb-4">
        <div class="font-(family-name:--theme-font-family) font-(--theme-font-weight) text-(length:--theme-font-size) leading-(--theme-line-height)">
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
