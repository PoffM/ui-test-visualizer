import type { ReactiveWeakMap } from '@solid-primitives/map'
import { For, Match, Show, Switch, createEffect, on, onCleanup, onMount } from 'solid-js'
import { createMutationObserver } from '@solid-primitives/mutation-observer'
import { type InspectedNode, containsNode } from './inspector-dom-tree'
import { inspectorMounted, search } from './Inspector'

interface TreeNodeProps {
  node: InspectedNode
  depth?: number
  onHover: (rect: DOMRect | null) => void
  collapsedStates: ReactiveWeakMap<Node, boolean>
  selectedNode: Node | null
  onSelect: (node: Node | null) => void
}

export function TreeNode(props: TreeNodeProps) {
  let container: HTMLDivElement | undefined

  const isCollapsed = () => isCollapsible() ? props.collapsedStates.get(props.node.node) : false
  const isMatching = () => {
    const node = props.node
    const element = node.type === 'element' ? node.node : node.node.parentElement
    return !!(element && search.matchedNodes().includes(element))
  }
  const isSelected = () => props.node.node === props.selectedNode

  function setCollapsed(value: boolean) {
    props.collapsedStates.set(props.node.node, value)
  }

  // Uncollapse when the selected node is a child of this node
  createEffect(on(() => props.selectedNode, (el) => {
    const node = props.node
    if (
      el instanceof Element
      && isCollapsed()
      && (
        containsNode(node.childNodes, el)
        || (node.type === 'element' && containsNode(node.shadowRoot?.childNodes ?? [], el))
      )
    ) {
      setCollapsed(false)
    }
  }))

  createEffect(() => {
    if (props.node.node === props.selectedNode) {
      container?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' })
    }
  })

  const depth = (props.depth || 0) + 2
  const paddingLeft = `calc(${depth * 1.5} * var(--spacing))`

  function isCollapsible() {
    if (props.node.type === 'text') { return false }
    if (props.node.type === 'shadow-root') { return true }
    if (props.node.type === 'element' && props.node.shadowRoot) { return true }
    if (rendersInline()) { return false }
    return true
  }

  function rendersInline() {
    // Has a shadow root -> false
    if (props.node.type === 'element' && props.node.shadowRoot) { return false }

    // Has no children -> true
    if (props.node.childNodes.length === 0) { return true }

    // Has a single text child -> true
    if (props.node.childNodes.length === 1 && props.node.childNodes[0]?.type === 'text') { return true }

    return false
  }

  // Plays the highlight animation when the tag or attribute name changes
  function playHighlightAnimation(element: HTMLElement) {
    const highlightColor = getComputedStyle(element).getPropertyValue('--vscode-editor-stackFrameHighlightBackground')
    element.animate(
      [
        { backgroundColor: highlightColor },
        { backgroundColor: 'transparent' },
      ],
      {
        duration: 1500,
        easing: 'cubic-bezier(0.55, 0, 1, 0.45)',
        fill: 'forwards',
      },
    )
  }

  // Listen for changes to the target node; play highlight on change
  function setupTagHighlights(tagElement: HTMLElement) {
    // Play the highlight animation when a new node is mounted,
    // Check if the inspector is mounted first to avoid flashing everything at once when you first open the inspector
    if (inspectorMounted.val) {
      onMount(() => playHighlightAnimation(tagElement))
    }
    createMutationObserver(
      () => props.node.type === 'element' ? props.node.node : [],
      { characterData: true, childList: true },
      () => playHighlightAnimation(tagElement),
    )
  }

  // Listen for changes to the target node's attributes; play highlight on change
  const attrNodeMap = new Map<string, HTMLElement>()
  function setupAttributeHighlights(attrElement: HTMLElement, attrName: string) {
    attrNodeMap.set(attrName, attrElement)
    onCleanup(() => attrNodeMap.delete(attrName))
  }
  createMutationObserver(
    () => props.node.type === 'element' ? props.node.node : [],
    { attributes: true },
    (muts) => {
      for (const mut of muts) {
        if (mut.type === 'attributes' && mut.attributeName) {
          const attrElement = attrNodeMap.get(mut.attributeName)
          if (attrElement) {
            playHighlightAnimation(attrElement)
          }
        }
      }
    },
  )

  return (
    <div>
      {/* Highlightable container around the node */}
      <div
        ref={container}
        class="relative min-w-9/10 box-content scroll-m-10"
        classList={{
          'bg-(--vscode-editor-selectionBackground) shadow-[100vw_0_0_var(--vscode-editor-selectionBackground)]': isSelected(),
          'bg-(--vscode-searchEditor-findMatchBackground) shadow-[100vw_0_0_var(--vscode-searchEditor-findMatchBackground)]': isMatching() && !isSelected(),
          'hover:bg-(--vscode-list-hoverBackground) hover:shadow-[100vw_0_0_var(--vscode-list-hoverBackground)]': !isSelected() && !isMatching(),
        }}
        onMouseEnter={() => props.onHover(props.node.getBoundingClientRect())}
        onMouseLeave={() => props.onHover(null)}
        onClick={() => props.onSelect(isSelected() ? null : props.node.node)}
        style={{ 'padding-left': paddingLeft }}
      >
        {/* Collapser button */}
        <Show when={isCollapsible()}>
          <button
            class="cursor-pointer text-html-collapser-arrow opacity-60 absolute top-0 -ml-3"
            style={{ left: paddingLeft }}
            onClick={() => setCollapsed(!isCollapsed())}
          >
            {isCollapsed() ? '▶' : '▼'}
          </button>
        </Show>

        <Switch>
          <Match when={props.node.type === 'element' && props.node}>
            {node => (
              <>
                {/* Opening tag */}
                <span class="text-html-tag">&lt;</span>
                <span class="text-html-tag" ref={setupTagHighlights}>{node().tagName}</span>

                {/* Attributes */}
                <For each={node().attributes}>
                  {attr => (
                    <span>
                      <span class="ml-1 text-html-attribute-name">{attr.name}</span>
                      <Show when={attr.value}>
                        <>
                          <span class="text-html-tag">=</span>
                          <span class="text-html-tag">"
                            <span
                              class="text-html-attribute-value"
                              ref={attrNode => setupAttributeHighlights(attrNode, attr.name)}
                            >
                              {attr.value}
                            </span>
                            "
                          </span>
                        </>
                      </Show>
                    </span>
                  )}
                </For>

                {/* '>' End of opening tag */}
                <span class="rounded-r-sm text-html-tag">&gt;</span>

                {/* Show an ellipsis when the node is collapsed */}
                <Show when={isCollapsed()}>
                  <span class="rounded-sm pl-1 pr-1">⋯</span>
                </Show>

                {/* Show text inline when it's the only child node */}
                <Show when={rendersInline() && node().childNodes.length === 1 && node().childNodes[0]?.type === 'text' && node().childNodes[0]}>
                  {(textChild) => {
                    const textNode = textChild()
                    return textNode.type === 'text' && <span class="">{textNode.text}</span>
                  }}
                </Show>

                {/* Inline closing tag */}
                <Show when={isCollapsed() || rendersInline()}>
                  <>
                    <span class="rounded-l-sm text-html-tag">&lt;/</span>
                    <span class="text-html-tag">{node().tagName}</span>
                    <span class="rounded-r-sm text-html-tag">&gt;</span>
                  </>
                </Show>
              </>
            )}
          </Match>
          <Match when={props.node.type === 'shadow-root' && props.node}>
            {_shadowRoot => (
              <div>#shadow-root</div>
            )}
          </Match>
        </Switch>

      </div>

      {/* Render children below the opening tag */}
      <Show when={!isCollapsed() && !rendersInline() && (props.node.type === 'element' || props.node.type === 'shadow-root') && props.node}>
        <>
          <For each={[
            (props.node.type === 'element' && props.node.shadowRoot),
            ...props.node.childNodes,
          ].filter(Boolean)}
          >
            {(child) => {
              if (child.type === 'text') {
                return (
                  <div style={{ 'padding-left': `calc(${(depth + 3) * 1.5} * var(--spacing))` }}>
                    {child.text}
                  </div>
                )
              }
              return (
                <TreeNode
                  node={child}
                  depth={depth + 1}
                  onHover={props.onHover}
                  collapsedStates={props.collapsedStates}
                  selectedNode={props.selectedNode}
                  onSelect={props.onSelect}
                />
              )
            }}
          </For>
          <Show when={props.node.type === 'element' && props.node}>
            {node => (
              // Closing tag for elements
              <div
                class="flex hover:bg-(--vscode-list-hoverBackground) hover:shadow-[100vw_0_0_var(--vscode-list-hoverBackground)]"
                onMouseEnter={() => props.onHover(node().getBoundingClientRect())}
                onMouseLeave={() => props.onHover(null)}
                style={{ 'padding-left': paddingLeft }}
              >
                <span class="text-html-tag">&lt;/{node().tagName}&gt;</span>
              </div>
            )}
          </Show>
        </>
      </Show>
    </div>
  )
}
