import { createInteractOutside } from '@kobalte/core'
import type { inferProcedureInput } from '@trpc/server'
import type { JSX } from 'solid-js'
import { For, Show, createSignal } from 'solid-js'
import { Dynamic } from 'solid-js/web'
import type { ExpectStatementType, PanelRouter } from '../../../extension/src/panel-controller/panel-router'
import { recorder, shadowHost } from '../App'
import { HighlightedNode } from '../components/HighlightedNode'
import { ContextMenu, ContextMenuContent, ContextMenuGroup, ContextMenuGroupLabel, ContextMenuItem, ContextMenuPortal, ContextMenuSeparator, ContextMenuShortcut, ContextMenuSub, ContextMenuSubContent, ContextMenuSubTrigger, ContextMenuTrigger } from '../components/solid-ui/context-menu'
import { deepElementFromPoint } from '../inspector/util'
import { FIREEVENT_MOUSE_EVENT_TYPES, USEREVENT_MOUSE_EVENT_TYPES } from './recorder'

export function RecorderContextMenuProvider(
  props: { children: JSX.Element, class?: string },
) {
  return (
    <Dynamic
      // Only enable the context menu when recording
      component={recorder.isRecording() ? RecorderContextMenu : 'div'}
      class={props.class}
    >
      {props.children}
    </Dynamic>
  )
}

function RecorderContextMenu(
  props: { children: JSX.Element, class?: string },
) {
  const [targetElement, setTargetElement] = createSignal<Element | null>(null)
  function updateTargetElement(e: MouseEvent | null) {
    if (!e) {
      setTargetElement(null)
      return
    }

    const clickedEl = (shadowHost.shadowRoot && deepElementFromPoint(shadowHost.shadowRoot, e.clientX, e.clientY)) ?? e.target
    if (!(clickedEl instanceof Element)) {
      return
    }
    setTargetElement(clickedEl)
  }

  async function submitRecorderInputEvent(
    eventType: string,
    { useExpect, useFireEvent, processInput }: {
      useExpect?: ExpectStatementType
      useFireEvent?: boolean
      processInput?: (input: inferProcedureInput<PanelRouter['recordInputAsCode']>) => inferProcedureInput<PanelRouter['recordInputAsCode']>
    } = {},
  ) {
    const target = targetElement()
    if (!target) {
      return
    }
    close()
    await recorder.submitRecorderInputEvent(target, eventType, { useExpect, useFireEvent, processInput })
  }

  const { setupMenuRef, isOpen, setOpenIfTrue, close } = enableSelectingDifferentNodeWhileMenuIsOpen(
    updateTargetElement,
  )

  function submitExpectStatement(
    statement: ExpectStatementDef,
    processInput: RecorderInputChanger | boolean | void,
  ) {
    submitRecorderInputEvent(
      'click',
      {
        useExpect: statement.type,
        processInput: typeof processInput === 'function' ? processInput : undefined,
      },
    )
    close()
  }

  function submitInputEvent(eventType: string, useFireEvent?: boolean) {
    submitRecorderInputEvent(eventType, { useFireEvent })
    close()
  }

  return (
    <>
      <ContextMenu
        // @ts-expect-error This is a valid prop
        open={isOpen()}
        onOpenChange={setOpenIfTrue}
      >
        <ContextMenuTrigger
          class="w-full h-full"
          // on right click, update the target element
          onMouseDown={e => e.button === 2 && updateTargetElement(e)}
        >
          {props.children}
        </ContextMenuTrigger>
        <ContextMenuPortal>
          <ContextMenuContent class="w-50" ref={setupMenuRef}>
            {/* 'Expect' statements */}
            <Show when={targetElement()}>
              {targetElement => (
                <ContextMenuGroup>
                  <ContextMenuGroupLabel>'Expect' Statement</ContextMenuGroupLabel>
                  <For each={EXPECT_STATEMENTS}>
                    {statement => (
                      <Show when={statement.handler ? statement.handler(targetElement()) : true} keyed>
                        {processInput => (
                          <ContextMenuItem
                            onClick={() => submitExpectStatement(statement, processInput)}
                          >
                            <span>{statement.title}</span>
                            {statement.shortcut && <ContextMenuShortcut>{statement.shortcut}</ContextMenuShortcut>}
                          </ContextMenuItem>
                        )}
                      </Show>
                    )}
                  </For>
                </ContextMenuGroup>
              )}
            </Show>
            <ContextMenuSeparator />

            {/* Mouse events */}
            <ContextMenuGroup>
              <ContextMenuGroupLabel>Mouse Event (userEvent)</ContextMenuGroupLabel>
              <For each={USEREVENT_MOUSE_EVENT_TYPES}>
                {eventType => (
                  <ContextMenuItem
                    onClick={() => submitInputEvent(eventType)}
                  >
                    <span>{eventType}</span>
                  </ContextMenuItem>
                )}
              </For>
            </ContextMenuGroup>

            <ContextMenuSeparator />
            <ContextMenuSub overlap>
              <ContextMenuSubTrigger>
                <span class="text-sm font-semibold whitespace-nowrap">
                  Mouse Event (fireEvent)
                </span>
              </ContextMenuSubTrigger>
              <ContextMenuPortal>
                <ContextMenuSubContent>
                  <For each={FIREEVENT_MOUSE_EVENT_TYPES}>
                    {eventType => (
                      <ContextMenuItem
                        onClick={() => submitInputEvent(eventType, true)}
                      >
                        <span>{eventType}</span>
                      </ContextMenuItem>
                    )}
                  </For>
                </ContextMenuSubContent>
              </ContextMenuPortal>
            </ContextMenuSub>

          </ContextMenuContent>
        </ContextMenuPortal>
      </ContextMenu>
      <Show when={targetElement()} keyed>
        {target => (
          <HighlightedNode node={target} />
        )}
      </Show>
    </>
  )
}

type RecorderInputChanger = (input: inferProcedureInput<PanelRouter['recordInputAsCode']>) => inferProcedureInput<PanelRouter['recordInputAsCode']>

interface ExpectStatementDef {
  title: string
  type: ExpectStatementType
  shortcut?: JSX.Element
  handler?: (e: Element) => (RecorderInputChanger | void) | boolean
}

/** Definitions of expect statements you can pick from in the context menu */
const EXPECT_STATEMENTS: ExpectStatementDef[] = [
  {
    title: 'expect(element)',
    type: 'minimal',
    shortcut: 'Alt+Click',
  },
  {
    title: `.toHaveValue(...)`,
    type: 'toHaveValue',
    handler: (el) => {
      if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
        return (input) => {
          input.eventData.text = el.value
          return input
        }
      }
    },
  },
  {
    title: '.toBeEnabled()',
    type: 'toBeEnabled',
    handler: (el) => {
      if (el instanceof HTMLInputElement
        || el instanceof HTMLTextAreaElement
        || el instanceof HTMLSelectElement
        || el instanceof HTMLButtonElement) {
        return true
      }
    },
  },
]

/**
 * Messy workaround to allow right-clicking outside the menu
 * to re-open it for a different target element
 */
function enableSelectingDifferentNodeWhileMenuIsOpen(
  updateTargetElement: (pointerEvent: PointerEvent | null) => void,
) {
  function setupMenuRef(ref: HTMLElement) {
    createInteractOutside({
      onPointerDownOutside: (customEvent) => {
        const target = customEvent.target
        if (target instanceof HTMLElement && target.closest('[data-ui-test-visualizer-menu-subcontent]')) {
          return
        }

        setOpen(false)
        updateTargetElement(null)
        const { originalEvent } = customEvent.detail
        if (originalEvent.button === 2) {
          queueMicrotask(() => {
            updateTargetElement(originalEvent)
          })
        }
      },
    }, () => ref)
  }

  const [isOpen, setOpen] = createSignal(false)

  function setOpenIfTrue(newVal: boolean) {
    if (newVal) {
      setOpen(newVal)
    }
  }

  function close() {
    // Send an escape key event to close the context menu
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))

    setOpen(false)
    updateTargetElement(null)
  }

  return {
    setupMenuRef,
    isOpen,
    setOpenIfTrue,
    close,
  }
}
