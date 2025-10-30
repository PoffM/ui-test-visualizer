import type { JSX } from 'solid-js'
import { For, Show, createSignal } from 'solid-js'
import { Dynamic } from 'solid-js/web'
import type { inferProcedureInput } from '@trpc/server'
import type { ExpectStatementType, PanelRouter } from '../../../extension/src/panel-controller/panel-router'
import { recorder, shadowHost } from '../App'
import { ContextMenu, ContextMenuContent, ContextMenuGroup, ContextMenuGroupLabel, ContextMenuItem, ContextMenuPortal, ContextMenuSeparator, ContextMenuShortcut, ContextMenuTrigger } from '../components/solid-ui/context-menu'
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
  function updateTargetElement(e: MouseEvent) {
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
    },
  ) {
    const target = targetElement()
    if (!target) {
      return
    }
    await recorder.submitRecorderInputEvent(target, eventType, { useExpect, useFireEvent, processInput })
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger
        class="w-full h-full"
        // on right click, update the target element
        onMouseDown={e => e.button === 2 && updateTargetElement(e)}
      >
        {props.children}
      </ContextMenuTrigger>
      <ContextMenuPortal>
        <ContextMenuContent class="w-50">
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
                          onClick={() => submitRecorderInputEvent(
                            'click',
                            {
                              useExpect: statement.type,
                              processInput: typeof processInput === 'function' ? processInput : undefined,
                            },
                          )}
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
          <For each={[
            { eventTypes: USEREVENT_MOUSE_EVENT_TYPES, title: 'Mouse Event (user-event)', useFireEvent: false, tooltip: 'Uses @testing-library/user-event' },
            { eventTypes: FIREEVENT_MOUSE_EVENT_TYPES, title: 'Mouse Event (fireEvent)', useFireEvent: true, tooltip: 'Uses testing-library\'s fireEvent' },
          ]}
          >{(section, idx) => (
            <>
              {idx() > 0 && <ContextMenuSeparator />}
              <ContextMenuGroup>
                <ContextMenuGroupLabel>{section.title}</ContextMenuGroupLabel>
                <For each={section.eventTypes}>
                  {eventType => (
                    <ContextMenuItem
                      onClick={() => submitRecorderInputEvent(
                        eventType,
                        { useFireEvent: section.useFireEvent },
                      )}
                    >
                      <span>{eventType}</span>
                    </ContextMenuItem>
                  )}
                </For>
              </ContextMenuGroup>
            </>
          )}
          </For>
        </ContextMenuContent>
      </ContextMenuPortal>
    </ContextMenu>
  )
}

interface ExpectDef {
  title: string
  type: ExpectStatementType
  shortcut?: JSX.Element
  handler?: (e: Element) => (((input: inferProcedureInput<PanelRouter['recordInputAsCode']>) => inferProcedureInput<PanelRouter['recordInputAsCode']>) | void)
}

const EXPECT_STATEMENTS: ExpectDef[] = [
  {
    title: 'expect(element)',
    type: 'minimal',
    shortcut: 'Alt+Click',
  },
  {
    title: '.toHaveValue',
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
]
