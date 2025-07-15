import { Show, createEffect, createSignal, onCleanup } from 'solid-js'
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
    textNodes,
    attributes,
    getBoundingClientRect: () => node.getBoundingClientRect(),
  }
}

export function Inspector() {
  const [hoveredRect, setHoveredRect] = createSignal<DOMRect | null>(null)
  const [domTree, setDomTree] = createSignal<DOMTree | null>(null, { equals: false })

  // Set up mutation observer to track DOM changes
  createEffect(() => {
    const shadowRoot = shadowHost?.shadowRoot
    if (!shadowRoot) { return }

    const observer = new MutationObserver(() => {
      const tree = parseDOMTree(shadowRoot.querySelector('body')!)
      setDomTree(tree)
    })

    observer.observe(shadowRoot, {
      childList: true,
      subtree: true,
      attributes: true,
      characterData: true,
    })

    setDomTree(parseDOMTree(shadowRoot.querySelector('body')!))

    onCleanup(() => observer.disconnect())
  })

  return (
    <>
      <div class="bg-[var(--vscode-editor-background)] text-[var(--vscode-editor-foreground)] h-1/3 w-full overflow-auto p-4 border-t border-[var(--vscode-panel-border)]">
        <Show when={domTree()}>
          {tree => (
            <TreeNode
              {...tree()}
              onHover={setHoveredRect}
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
