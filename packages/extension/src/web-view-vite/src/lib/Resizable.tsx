import { makeEventListener } from '@solid-primitives/event-listener'
import type { ParentProps } from 'solid-js'
import { createEffect, createSignal } from 'solid-js'

export interface ResizableProps extends ParentProps {
  initialWidth: number
}

/**
 * Horizontally resizable div with drag handles.
 * Both sides increase and decrease in width together to keep the div centered.
 */
export function Resizable(props: ResizableProps) {
  // The change in width.
  const [offset, setOffset] = createSignal(0)

  function initDragHandle(handle: HTMLDivElement, direction: 1 | -1) {
    makeEventListener(handle, 'mousedown', (startEvent) => {
      startEvent.preventDefault()

      let lastX = startEvent.clientX
      const disposeDragHandle = makeEventListener(
        window,
        'mousemove',
        (currentEvent) => {
          currentEvent.preventDefault()
          setOffset(it => it + (currentEvent.clientX - lastX) * direction)
          lastX = currentEvent.clientX
        },
      )

      const disposeEndDrag = makeEventListener(window, 'mouseup', () => {
        disposeDragHandle()
        disposeEndDrag()
      })
    })
  }

  function initResizer(el: HTMLDivElement) {
    createEffect(() => {
      el.style.width = `${props.initialWidth + offset() * 2}px`
    })
  }

  return (
    <div class="relative max-w-[100vw]" ref={initResizer}>
      {props.children}
      <div
        class="absolute w-[10px] cursor-w-resize"
        style={{ inset: '0px auto 0px -5px' }}
        ref={el => initDragHandle(el, -1)}
      />
      <div
        class="absolute w-[10px] cursor-w-resize"
        style={{ inset: '0px -5px 0px auto' }}
        ref={el => initDragHandle(el, 1)}
      />
    </div>
  )
}
