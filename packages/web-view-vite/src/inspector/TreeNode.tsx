import type { ReactiveWeakMap } from '@solid-primitives/map'
import { For, Match, Show, Switch, createEffect, createMemo, on, onCleanup, onMount } from 'solid-js'
import { createMutationObserver } from '@solid-primitives/mutation-observer'
import { type InspectedNode, containsNode } from './inspector-dom-tree'
import { disableHighlightAnimation, search } from './Inspector'

interface TreeNodeProps {
  node: InspectedNode
  depth?: number
  onHover: (node: Node | null) => void
  collapsedStates: ReactiveWeakMap<Node, boolean>
  selectedNode: Node | null
  onSelect: (node: Node | null) => void
}

/** Map of elements to functions that play the highlight animation for that element in the inspector. */
const highlightPlayers = new WeakMap<Node, () => void>()

export function TreeNode(props: TreeNodeProps) {
  let container: HTMLDivElement | undefined

  const rendersInline = createMemo(() => {
    // Has a shadow root -> false
    if (props.node.type === 'element' && props.node.shadowRoot) { return false }

    // Has no children -> true
    if (props.node.childNodes.length === 0) { return true }

    // Has a single text child -> true
    if (props.node.childNodes.length === 1 && props.node.childNodes[0]?.type === 'text') { return true }

    return false
  })

  const isCollapsed = () => isCollapsible() ? props.collapsedStates.get(props.node.node) : false
  const isMatching = () => {
    // When the node is matching
    return search.matchedNodes().has(props.node.node)
      // When the only child text node is matching, highlight the whole line with the tag and the text
      || (rendersInline() && search.matchedNodes().has(props.node.node.childNodes[0]!))
  }
  const isSelected = () => {
    // When the node is matching
    return props.node.node === props.selectedNode
      // When the only child text node is selected, highlight the whole line with the tag and the text
      || (rendersInline() && props.node.node.childNodes[0] === props.selectedNode)
  }

  function setCollapsed(value: boolean) {
    disableHighlightAnimation.val = true
    props.collapsedStates.set(props.node.node, value)
    setTimeout(() => disableHighlightAnimation.val = false, 0)
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
    if (isSelected()) {
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

  // Plays the highlight animation when the tag or attribute name changes
  function playHighlightAnimation(element: Element) {
    if (disableHighlightAnimation.val) { return }

    element.animate(
      [
        {
          backgroundColor: 'var(--color-html-tag)',
          color: 'var(--vscode-panel-background)',
        },
        {
          offset: 0.8,
          backgroundColor: 'var(--vscode-panel-background)',
          color: 'inherit',
        },
        {
          backgroundColor: 'inherit',
        },
      ],
      {
        duration: 1400,
        easing: 'cubic-bezier(0, 0, 0.2, 1)',
        fill: 'forwards',
      },
    )
  }

  // Listen for changes to the target node; play highlight on change
  function setupTagHighlights(inspectorEl: HTMLElement) {
    highlightPlayers.set(props.node.node, () => playHighlightAnimation(inspectorEl))
    // Play the highlight animation when a new node is mounted,
    // Check if the inspector is mounted first to avoid flashing everything at once when you first open the inspector
    if (!disableHighlightAnimation.val) {
      onMount(() => playHighlightAnimation(inspectorEl))
    }

    // For Elements
    createMutationObserver(
      () => props.node.type === 'element' ? props.node.node : [],
      { characterData: true, childList: true },
      () => playHighlightAnimation(inspectorEl),
    )
    // For Text nodes
    createMutationObserver(
      () => props.node.type === 'text' ? props.node.node : [],
      { characterData: true },
      () => {
        const parent = props.node.node.parentElement
        if (parent) {
          highlightPlayers.get(parent)?.()
        }
        playHighlightAnimation(inspectorEl)
      },
    )
  }

  // Listen for changes to the target node's attributes; play highlight on change
  const attrNodeMap = new Map<string, HTMLElement>()
  function setupAttributeHighlights(attrElement: HTMLElement, attrName: string) {
    attrNodeMap.set(attrName, attrElement)
    onCleanup(() => attrNodeMap.delete(attrName))

    if (!disableHighlightAnimation.val) {
      onMount(() => playHighlightAnimation(attrElement))
    }
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
        class="relative box-content scroll-m-10 min-w-[200px]"
        classList={{
          'bg-(--vscode-editor-selectionBackground)': isSelected(),
          'bg-(--vscode-searchEditor-findMatchBackground)': isMatching() && !isSelected(),
          'hover:bg-(--vscode-list-hoverBackground)': !isSelected() && !isMatching(),
        }}
        onMouseEnter={() => props.onHover(props.node.node)}
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
                <span class="text-html-tag">
                  <span ref={setupTagHighlights}>
                    {node().tagName}
                  </span>
                </span>

                {/* Attributes */}
                <For each={node().attributes}>
                  {attr => (
                    <span>
                      <span class="ml-1 text-html-attribute-name">{attr.name}</span>
                      <Show when={attr.value}>
                        <>
                          <span class="text-html-tag">=</span>
                          <span class="text-html-tag">"
                            <span class="text-html-attribute-value">
                              <span ref={attrNode => setupAttributeHighlights(attrNode, attr.name)}>
                                {attr.value}
                              </span>
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
                <Show when={rendersInline() && node().childNodes.length === 1 && node().childNodes[0]?.type === 'text' && node().childNodes[0]} keyed>
                  {(textNode) => {
                    function setupInlineTextHighlights(span: HTMLSpanElement) {
                      highlightPlayers.set(textNode.node, () => playHighlightAnimation(span))

                      if (!disableHighlightAnimation.val) {
                        onMount(() => playHighlightAnimation(span))
                      }

                      createMutationObserver(
                        () => textNode.node,
                        { characterData: true },
                        () => {
                          // Highlight the inline text
                          playHighlightAnimation(span)

                          // Also Highlight the parent tag when the text node changes
                          const parent = textNode.node.parentElement
                          if (parent) {
                            highlightPlayers.get(parent)?.()
                          }
                        },
                      )
                    }

                    return textNode.type === 'text' && (
                      <span ref={setupInlineTextHighlights}>{textNode.text}</span>
                    )
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
            {shadowRoot => (
              <div>#shadow-root ({shadowRoot().shadowMode})</div>
            )}
          </Match>
          <Match when={props.node.type === 'text' && props.node}>
            {textNode => (
              <span ref={setupTagHighlights}>{textNode().text}</span>
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
            {child => (
              <TreeNode
                node={child}
                depth={depth + 1}
                onHover={props.onHover}
                collapsedStates={props.collapsedStates}
                selectedNode={props.selectedNode}
                onSelect={props.onSelect}
              />
            )}
          </For>
          <Show when={props.node.type === 'element' && props.node}>
            {node => (
              // Closing tag for elements
              <div
                class="hover:bg-(--vscode-list-hoverBackground)"
                onMouseEnter={() => props.onHover(node().node)}
                onMouseLeave={() => props.onHover(null)}
                onClick={() => props.onSelect(isSelected() ? null : props.node.node)}
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
