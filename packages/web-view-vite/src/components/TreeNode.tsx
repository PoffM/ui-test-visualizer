import { For, createSignal } from 'solid-js'

export interface DOMTree {
  tagName: string
  textNodes: string | undefined
  attributes: { name: string, value: string }[]
  childTrees: DOMTree[]
  getBoundingClientRect: () => DOMRect
}

interface TreeNodeProps extends DOMTree {
  depth?: number
  onHover: (rect: DOMRect | null) => void
}

export function TreeNode(props: TreeNodeProps) {
  const [isCollapsed, setIsCollapsed] = createSignal(false)
  const depth = props.depth || 0
  const indent = '  '.repeat(depth)
  const hasChildren = props.childTrees.length > 0

  const renderAttributes = () => {
    return props.attributes.map(attr => (
      <span class="text-[var(--vscode-symbolIcon-propertyForeground)] whitespace-nowrap">
        <span class="ml-1 ">{attr.name}</span>
        {attr.value !== '' && (
          <span>="<span class="text-[var(--vscode-symbolIcon-stringForeground)]">{attr.value.trim()}</span>"</span>
        )}
      </span>
    ))
  }

  return (
    <div class="font-mono">
      <div
        class="flex items-center hover:bg-[var(--vscode-list-hoverBackground)] cursor-pointer"
        onMouseEnter={() => props.onHover(props.getBoundingClientRect())}
        onMouseLeave={() => props.onHover(null)}
      >
        <span class="inline-flex items-center">
          {indent}
          {hasChildren && (
            <span
              class="cursor-pointer inline-block w-4 select-none text-[var(--vscode-editor-foreground)] opacity-60"
              onClick={() => setIsCollapsed(!isCollapsed())}
            >
              {isCollapsed() ? '▶' : '▼'}
            </span>
          )}
          {!hasChildren && <span class="w-4" />}
          <span class="text-[var(--vscode-symbolIcon-classForeground)]">&lt;{props.tagName}</span>
          {props.attributes.length > 0 && renderAttributes()}
          <span class="text-[var(--vscode-symbolIcon-classForeground)]">&gt;</span>
          {(props.textNodes?.length ?? 0) < 20 && (
            <span class="text-[var(--vscode-editor-foreground)] whitespace-nowrap">{props.textNodes?.trim()}</span>
          )}
          {(props.textNodes?.length ?? 0) >= 20 && (
            <div class="text-[var(--vscode-editor-foreground)]">{props.textNodes?.trim()}</div>
          )}
          {isCollapsed() && <span>&hellip;</span>}
          {((!hasChildren && props.textNodes) || isCollapsed()) && (
            <span class="text-[var(--vscode-symbolIcon-classForeground)]">&lt;/{props.tagName}&gt;</span>
          )}
        </span>
      </div>
      {!isCollapsed() && hasChildren && (
        <>
          <div class="ml-4">
            <For each={props.childTrees}>
              {child => (
                <TreeNode
                  {...child}
                  depth={depth + 1}
                  onHover={props.onHover}
                />
              )}
            </For>
          </div>
          <div>
            {indent}
            <span class="w-4 inline-block" />
            <span class="text-[var(--vscode-symbolIcon-classForeground)]">&lt;/{props.tagName}&gt;</span>
          </div>
        </>
      )}
    </div>
  )
}
