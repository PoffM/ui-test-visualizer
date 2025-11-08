import { makeEventListener } from '@solid-primitives/event-listener'
import { createSignal } from 'solid-js'

/** Shows a highlight overlay over the given node */
export function HighlightedNode(props: { node: Node }) {
  function newRect() {
    return props.node instanceof Text
      ? (() => {
          const range = document.createRange()
          range.selectNodeContents(props.node)
          return range.getBoundingClientRect()
        })()
      : props.node instanceof Element
        ? props.node.getBoundingClientRect()
        : props.node.parentElement?.getBoundingClientRect()
  }

  const [rect, setRect] = createSignal(newRect())

  // Update the rect on scroll, click, etc
  makeEventListener(window, 'resize', () => setRect(newRect()))
  makeEventListener(window, 'scroll', () => setRect(newRect()))
  makeEventListener(window, 'wheel', () => setRect(newRect()))
  makeEventListener(window, 'mousedown', () => setRect(newRect()))
  makeEventListener(window, 'mouseup', () => setRect(newRect()))
  makeEventListener(window, 'click', () => setRect(newRect()))

  return (
    <div
      class="fixed z-50 pointer-events-none bg-[var(--vscode-editorLightBulbAutoFix-foreground)] opacity-60 transition-all duration-100 min-h-[1px] min-w-[1px]"
      style={{
        top: `${rect()?.top}px`,
        left: `${rect()?.left}px`,
        width: `${rect()?.width}px`,
        height: `${rect()?.height}px`,
      }}
    />
  )
}
