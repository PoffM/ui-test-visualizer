import type { ReactiveWeakMap } from '@solid-primitives/map'
import { For, Show } from 'solid-js'

export interface DOMTree {
  tagName: string
  textNodes: string | undefined
  attributes: { name: string, value: string }[]
  childTrees: DOMTree[]
  shadowTrees: DOMTree[] | null
  getBoundingClientRect: () => DOMRect
  node: Element
  isChanged: () => boolean
}

interface TreeNodeProps extends DOMTree {
  depth?: number
  onHover: (rect: DOMRect | null) => void
  collapsedStates: ReactiveWeakMap<Element, boolean>
}

export function TreeNode(props: TreeNodeProps) {
  const isCollapsed = () => props.collapsedStates.get(props.node) ?? false
  function setIsCollapsed(value: boolean) {
    props.collapsedStates.set(props.node, value)
  }

  const depth = (props.depth || 0) + 2
  const paddingLeft = `calc(${depth * 1.5} * var(--spacing))`
  const hasChildren = (props.childTrees.length + (props.shadowTrees?.length ?? 0)) > 0

  const renderAttributes = () => {
    return props.attributes.map(attr => (
      <span data-highlight>
        <span class="ml-1 text-[var(--theme-entity-other-attribute-name)]">{attr.name}</span>
        {attr.value !== '' && (
          <>
            <span class="text-[var(--theme-punctuation)]">=</span>
            <span class="text-[var(--theme-string)]">"{attr.value.trim()}"</span>
          </>
        )}
      </span>
    ))
  }

  return (
    <div classList={{ 'animate-highlight': props.isChanged() }}>
      <div
        class="relative hover:bg-(--vscode-list-hoverBackground) min-w-9/10 box-content hover:shadow-[100vw_0_0_var(--vscode-list-hoverBackground)]"
        onMouseEnter={() => props.onHover(props.getBoundingClientRect())}
        onMouseLeave={() => props.onHover(null)}
        style={{ 'padding-left': paddingLeft }}
      >
        {hasChildren && props.depth && (
          <button
            class="cursor-pointer text-[var(--vscode-editor-foreground)] opacity-60 absolute top-0 -ml-3"
            style={{ left: paddingLeft }}
            onClick={() => setIsCollapsed(!isCollapsed())}
          >
            {isCollapsed() ? '▶' : '▼'}
          </button>
        )}
        {!hasChildren && <b class="shrink-0 w-3" />}
        <span class="rounded-l-sm text-[var(--theme-punctuation)]" data-highlight>&lt;</span>
        <span class="text-[var(--theme-entity-name-tag)]" data-highlight>{props.tagName}</span>
        {props.attributes.length > 0 && renderAttributes()}
        <span class="rounded-r-sm text-[var(--theme-punctuation)]" data-highlight>&gt;</span>
        {props.textNodes && (
          <span class="text-[var(--theme-text)]">{props.textNodes.trim()}</span>
        )}
        {isCollapsed() && <span class="rounded-sm pl-1 pr-1 bg-(--theme-entity-name-tag) text-(--theme-punctuation)">⋯</span>}
        {((!hasChildren && props.textNodes) || isCollapsed()) && (
          <>
            <span class="rounded-l-sm text-[var(--theme-punctuation)]">&lt;/</span>
            <span class="text-[var(--theme-entity-name-tag)]">{props.tagName}</span>
            <span class="rounded-r-sm text-[var(--theme-punctuation)]">&gt;</span>
          </>
        )}
      </div>
      {!isCollapsed() && hasChildren && (
        <>
          <Show when={props.shadowTrees}>
            {shadowTrees => (
              <div>
                <div class="text-[var(--vscode-symbolIcon-fieldForeground)]">#shadow-root</div>
                <For each={shadowTrees()}>
                  {child => (
                    <TreeNode
                      {...child}
                      depth={depth + 1}
                      onHover={props.onHover}
                      collapsedStates={props.collapsedStates}
                    />
                  )}
                </For>
              </div>
            )}
          </Show>
          <For each={props.childTrees}>
            {child => (
              <TreeNode
                {...child}
                depth={depth + 1}
                onHover={props.onHover}
                collapsedStates={props.collapsedStates}
              />
            )}
          </For>
          <div
            class="flex hover:bg-(--vscode-list-hoverBackground) hover:shadow-[100vw_0_0_var(--vscode-list-hoverBackground)]"
            onMouseEnter={() => props.onHover(props.getBoundingClientRect())}
            onMouseLeave={() => props.onHover(null)}
            style={{ 'padding-left': paddingLeft }}
          >
            <span class="text-[var(--theme-punctuation)]">&lt;/</span>
            <span class="text-[var(--theme-entity-name-tag)]">{props.tagName}</span>
            <span class="text-[var(--theme-punctuation)]">&gt;</span>
          </div>
        </>
      )}
    </div>
  )
}
