import type { Component, ValidComponent } from 'solid-js'
import { onMount, splitProps } from 'solid-js'

import type { PolymorphicProps } from '@kobalte/core/polymorphic'
import * as PopoverPrimitive from '@kobalte/core/popover'
import { cn } from './utils'

const Popover: Component<PopoverPrimitive.PopoverRootProps> = (props) => {
  return <PopoverPrimitive.Root gutter={4} {...props} />
}

const PopoverTrigger = PopoverPrimitive.Trigger

function PopoverArrow(props: PopoverPrimitive.PopoverArrowProps) {
  const [local, others] = splitProps(props as PopoverContentProps, ['class'])

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
          local.class,
        )}
        {...others}
      />
    </div>
  )
}

type PopoverContentProps<T extends ValidComponent = 'div'> =
  PopoverPrimitive.PopoverContentProps<T> & { class?: string | undefined }

function PopoverContent<T extends ValidComponent = 'div'>(props: PolymorphicProps<T, PopoverContentProps<T>>) {
  const [local, others] = splitProps(props as PopoverContentProps, ['class'])
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        class={cn(
          'z-50 w-72 origin-[var(--kb-popover-content-transform-origin)] rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none data-[expanded]:animate-in data-[closed]:animate-out [animation-duration:50ms!important] data-[closed]:fade-out-0 data-[expanded]:fade-in-0 data-[closed]:zoom-out-95 data-[expanded]:zoom-in-95',
          local.class,
        )}
        {...others}
      />
    </PopoverPrimitive.Portal>
  )
}

export { Popover, PopoverTrigger, PopoverContent, PopoverArrow }
