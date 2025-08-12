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

  makeEventListener(document, 'mouseleave', () => {
    setIsDragging(false)
  })

  return (
    // invisible line to divide the 2 sections
    <div
      class="relative z-70 h-0"
      style={{ 'background-color': 'transparent' }}
    >
      {/* invisible drag handle with bigger hitbox than the visible line */}
      <div class="absolute w-full h-3 -top-1.5 cursor-ns-resize flex flex-col justify-center" onMouseDown={handleMouseDown} />
      {/* visible drag handle line */}
      <hr class="h-[2px] bg-[var(--vscode-panel-border)]" />
    </div>
  )
}
