import { createSignal } from 'solid-js'
import { makeEventListener } from '@solid-primitives/event-listener'

interface ResizerProps {
  onResize: (height: number) => void
}

export function Resizer(props: ResizerProps) {
  const [isDragging, setIsDragging] = createSignal(false)

  function handleMouseDown(e: MouseEvent) {
    setIsDragging(true)
    e.preventDefault()
  }

  // Use makeEventListener for mousemove
  makeEventListener(document, 'mousemove', (e) => {
    if (!isDragging()) { return }
    props.onResize(window.innerHeight - e.clientY)
  })

  // Use makeEventListener for mouseup
  makeEventListener(document, 'mouseup', () => {
    setIsDragging(false)
  })

  return (
    <div
      class="relative z-1 h-2 cursor-ns-resize -mt-1 -mb-1"
      onMouseDown={handleMouseDown}
      style={{ 'background-color': 'transparent' }}
    >
      <hr class="mt-1 border-t border-[var(--vscode-panel-border)]" />
    </div>
  )
}
