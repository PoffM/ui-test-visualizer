import type { ReactiveWeakMap } from '@solid-primitives/map'
import { For, Show, createEffect, on } from 'solid-js'
import { type DOMTree, containsNode } from '../lib/inspector-dom-tree'

import { search } from './Inspector'

interface TreeNodeProps {
  treeNode: DOMTree
  depth?: number
  onHover: (rect: DOMRect | null) => void
  collapsedStates: ReactiveWeakMap<Element, boolean>
  selectedNode: Element | null
  onSelect: (node: Element | null) => void
}

export function TreeNode(props: TreeNodeProps) {
  let container: HTMLDivElement | undefined

  const isCollapsed = () => isCollapsible() ? props.collapsedStates.get(treeNode().node) : false
  const isMatching = () => search.matchedNodes().includes(treeNode().node)
  const isSelected = () => treeNode().node === props.selectedNode
  const treeNode = () => props.treeNode

  function setCollapsed(value: boolean) {
    props.collapsedStates.set(treeNode().node, value)
  }

  createEffect(on(() => props.selectedNode, (el) => {
    if (el && isCollapsed() && (containsNode(treeNode().childNodes, el) || containsNode(treeNode().shadowChildNodes, el))) {
      setCollapsed(false)
    }
  }))

  createEffect(() => {
    if (treeNode().node === props.selectedNode) {
      container?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' })
    }
  })

  const depth = (props.depth || 0) + 2
  const paddingLeft = `calc(${depth * 1.5} * var(--spacing))`
  const hasChildren = (treeNode().childNodes.length + (treeNode().shadowChildNodes?.length ?? 0)) > 0

  function isCollapsible() {
    if (treeNode().shadowChildNodes) { return true }
    if (treeNode().childNodes.length === 0) { return false }
    if (treeNode().childNodes.length === 1 && typeof treeNode().childNodes[0] === 'string') { return false }
    return true
  }

  function rendersInline() {
    if (treeNode().shadowChildNodes) { return false }
    if (treeNode().childNodes.length === 0) { return true }
    if (treeNode().childNodes.length === 1 && typeof treeNode().childNodes[0] === 'string') { return true }
  }

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
        onMouseEnter={() => props.onHover(treeNode().getBoundingClientRect())}
        onMouseLeave={() => props.onHover(null)}
        onClick={() => props.onSelect(isSelected() ? null : treeNode().node)}
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

        {!hasChildren && <b class="shrink-0 w-3" />}

        {/* Opening tag */}
        <span class="text-html-tag" data-highlight>&lt;{treeNode().tagName}</span>

        {/* Attributes */}
        <For each={treeNode().attributes}>
          {attr => (
            <span data-highlight>
              <span class="ml-1 text-html-attribute-name">{attr.name}</span>
              <Show when={attr.value}>
                <>
                  <span class="text-html-tag">=</span>
                  <span class="text-html-tag">"
                    <span class="text-html-attribute-value">
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
        <span class="rounded-r-sm text-html-tag" data-highlight>&gt;</span>

        {/* Show an ellipsis when the node is collapsed */}
        <Show when={isCollapsed()}>
          <span class="rounded-sm pl-1 pr-1">⋯</span>
        </Show>

        {/* Show text inline when it's the only child node */}
        <Show when={rendersInline() && treeNode().childNodes.length === 1 && typeof treeNode().childNodes[0] === 'string'}>
          <span class="">{treeNode().childNodes[0] as string}</span>
        </Show>

        {/* Inline closing tag */}
        <Show when={isCollapsed() || treeNode().childNodes.length === 1 && typeof treeNode().childNodes[0] === 'string' || rendersInline()}>
          <>
            <span class="rounded-l-sm text-html-tag">&lt;/</span>
            <span class="text-html-tag">{treeNode().tagName}</span>
            <span class="rounded-r-sm text-html-tag">&gt;</span>
          </>
        </Show>
      </div>

      {/* Render children */}
      <Show when={!isCollapsed() && !rendersInline()}>
        <>
          <Show when={treeNode().shadowChildNodes}>
            {shadowChildNodes => (
              <div>
                <div style={{ 'padding-left': `calc(${(depth + 3) * 1.5} * var(--spacing))` }}>#shadow-root</div>
                <For each={shadowChildNodes()}>
                  {(child) => {
                    if (typeof child === 'string') {
                      return (
                        <div style={{ 'padding-left': `calc(${(depth + 3) * 1.5} * var(--spacing))` }}>
                          {child}
                        </div>
                      )
                    }
                    return (
                      <TreeNode
                        treeNode={child}
                        depth={depth + 3}
                        onHover={props.onHover}
                        collapsedStates={props.collapsedStates}
                        selectedNode={props.selectedNode}
                        onSelect={props.onSelect}
                      />
                    )
                  }}
                </For>
              </div>
            )}
          </Show>
          <For each={treeNode().childNodes}>
            {(child) => {
              if (typeof child === 'string') {
                return (
                  <div style={{ 'padding-left': `calc(${(depth + 3) * 1.5} * var(--spacing))` }}>
                    {child}
                  </div>
                )
              }
              return (
                <TreeNode
                  treeNode={child}
                  depth={depth + 1}
                  onHover={props.onHover}
                  collapsedStates={props.collapsedStates}
                  selectedNode={props.selectedNode}
                  onSelect={props.onSelect}
                />
              )
            }}
          </For>
          <div
            class="flex hover:bg-(--vscode-list-hoverBackground) hover:shadow-[100vw_0_0_var(--vscode-list-hoverBackground)]"
            onMouseEnter={() => props.onHover(treeNode().getBoundingClientRect())}
            onMouseLeave={() => props.onHover(null)}
            style={{ 'padding-left': paddingLeft }}
          >
            <span class="text-html-tag">&lt;/{treeNode().tagName}&gt;</span>
          </div>
        </>
      </Show>
    </div>
  )
}
