import type { Component } from 'solid-js'
import { onMount, splitProps } from 'solid-js'

import { Popover as PopoverPrimitive } from '@kobalte/core'
import { cn } from '../lib/utils'

const Popover: Component<PopoverPrimitive.PopoverRootProps> = (props) => {
  return <PopoverPrimitive.Root gutter={4} {...props} />
}

const PopoverTrigger = PopoverPrimitive.Trigger

function PopoverArrow(props: PopoverPrimitive.PopoverArrowProps) {
  const [, rest] = splitProps(props, ['class'])

  // Give the arrow a fill color with better contrast against the background
  let wrapper: HTMLDivElement | undefined
  onMount(() => {
    if (!wrapper) {
      return
    }
    const paths = wrapper.querySelectorAll('path')
    for (const path of paths) {
      path.setAttribute('fill', 'var(--vscode-menu-border)')
    }
  })

  return (
    <div ref={wrapper}>
      <PopoverPrimitive.Arrow
        class={cn(
          props.class,
        )}
        {...rest}
      />
    </div>
  )
}

const PopoverContent: Component<PopoverPrimitive.PopoverContentProps> = (props) => {
  const [, rest] = splitProps(props, ['class'])
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        class={cn(
          'z-50 w-72 origin-[var(--kb-popover-content-transform-origin)] rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none data-[expanded]:animate-in data-[closed]:animate-out [animation-duration:50ms!important] data-[closed]:fade-out-0 data-[expanded]:fade-in-0 data-[closed]:zoom-out-95 data-[expanded]:zoom-in-95',
          props.class,
        )}
        {...rest}
      />
    </PopoverPrimitive.Portal>
  )
}

export { Popover, PopoverTrigger, PopoverContent, PopoverArrow }
