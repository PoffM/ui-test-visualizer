import { makeEventListener } from '@solid-primitives/event-listener'
import { ReactiveMap } from '@solid-primitives/map'
import type { EventType, QueryArgs, Suggestion } from '@testing-library/dom'
import { getSuggestedQuery } from '@testing-library/dom'
import type { userEvent } from '@testing-library/user-event'
import { createEffect, createSignal } from 'solid-js'
import type { z } from 'zod/mini'
import { createMutationObserver } from '@solid-primitives/mutation-observer'
import type { zRecordedEventData } from '../../../extension/src/panel-controller/panel-router'
import type { RecorderCodeInsertions } from '../../../extension/src/recorder/recorder-codegen-session'
import { deepElementFromPoint } from '../inspector/util'
import { client } from '../lib/panel-client'
import { openPanel, setOpenPanel } from '../App'

export const USEREVENT_MOUSE_EVENT_TYPES: (keyof typeof userEvent)[] = [
  'click',
  'dblClick',
  'hover',
  'unhover',
  'clear',
]

export const FIREEVENT_MOUSE_EVENT_TYPES: EventType[] = [
  'click',
  'dblClick',
  'mouseDown',
  'mouseUp',
  'mouseEnter',
  'mouseLeave',
  'mouseMove',
  'mouseOver',
  'mouseOut',
  'contextMenu',
]

export function createRecorder(shadowHost: HTMLDivElement) {
  function isRecording() {
    return openPanel() === 'recorder'
  }
  const [mouseEvent, setMouseEvent] = createSignal<EventType>('click')
  const [useUserEvent, setUseUserEvent] = createSignal(true)
  const [codeInsertions, setCodeInsertions] = createSignal<RecorderCodeInsertions | undefined>()

  // When the edit is performed, clear the recorder UI's insertions state
  makeEventListener(window, 'message', (event) => {
    if (event.data.recorderEditPerformed) {
      setCodeInsertions(undefined)
    }
  })

  const { hasPendingInputChange } = trackPendingInputChanges(shadowHost, isRecording)

  const [rootElement, setRootElement] = createSignal<Node | null>(
    shadowHost.shadowRoot?.children[0] ?? null,
  )
  createMutationObserver(shadowHost.shadowRoot!, { childList: true }, () => {
    setRootElement(shadowHost.shadowRoot?.children[0] ?? null)
  })

  createEffect(() => {
    const root = rootElement()
    if (!root) {
      return
    }
    if (isRecording()) {
      for (const eventType of ['click', 'submit', 'change'] as const) {
        makeEventListener(root, eventType, async (e: Event) => {
          let target = e.target

          // When clicking, use deepElementFromPoint to get the right element if it's inside a shadow root.
          if (e instanceof MouseEvent) {
            const clickedEl = (shadowHost.shadowRoot && deepElementFromPoint(shadowHost.shadowRoot, e.clientX, e.clientY)) ?? e.target
            if (!(clickedEl instanceof Element)) {
              return
            }
            target = clickedEl
          }

          if (!(target instanceof Element)) {
            return
          }

          let suggestedQuery: Suggestion | undefined

          /**
           * Sometimes testing-library can't find a good query to use.
           * This fn checks if testing-library generated a useful query.
           */
          function hasQuery() {
            if (!suggestedQuery) {
              return false
            }
            if (suggestedQuery.queryArgs[0] === 'document') {
              return false
            }
            return true
          }

          // Generate the selector using the closest HTMLElement.
          // e.g. if you click on an SVG, that doesn't count as an HTMLElement,
          // so step up to the parent.
          while (!hasQuery() && target) {
            if (target instanceof HTMLElement) {
              suggestedQuery = getSuggestedQuery(target)
            }
            if (!hasQuery()) {
              if (target instanceof Element && target.parentElement) {
                target = target.parentElement
              }
              else {
                return
              }
            }
          }

          if (!hasQuery() || !suggestedQuery) {
            return
          }

          const eventData: z.infer<typeof zRecordedEventData> = {}

          if (eventType === 'change' && (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement)) {
            const text = target.value
            eventData.text = text
          }

          const recordedEventType = (() => {
            if (eventType === 'click') {
              return mouseEvent()
            }

            if (eventType === 'change' && target instanceof HTMLSelectElement) {
              eventData.options = [target.value]
              return 'selectOptions'
            }

            return eventType
          })()

          const query = serializeQueryArgs(suggestedQuery.queryArgs)

          // When the 'alt' key is held while clicking, generate an 'expect' statement
          const useExpect = eventType === 'click' && e instanceof MouseEvent && e.altKey

          // Send the selector to the extension process to record as code
          const insertions = await client.recordInputAsCode.mutate({
            event: recordedEventType,
            query: [suggestedQuery.queryMethod, query],
            eventData,
            useExpect,
            useUserEvent: useUserEvent(),
          })
          setCodeInsertions(insertions)
        })
      }
    }
    else {
      makeEventListener(root, 'beforeinput', (e) => {
        // Block changing inputs when not recording
        e.preventDefault()
      })
    }
  })

  return {
    isRecording,
    toggle: (recording: boolean) => {
      setOpenPanel(recording ? 'recorder' : null)
    },
    removeInsertion: async (line: number, idx?: number) => {
      const newInsertions = await client.removeRecorderInsertion.mutate({ line, idx })
      setCodeInsertions(newInsertions)
    },
    mouseEvent,
    setMouseEvent,
    useUserEvent,
    setUseUserEvent,
    codeInsertions,
    hasPendingInputChange,
  }
}

/**
 * Convert the queryArgs from testing-library to JSON to be sent to the extension process.
 * Mainly to convert the RegExp to a string before sending it.
 */
export function serializeQueryArgs(queryArgs: QueryArgs): [string | SerializedRegexp, { [key: string]: string | boolean | SerializedRegexp }?] {
  const [query, options] = queryArgs
  if (!options) {
    // @ts-expect-error Not declared the testing library, but the query could be a RegExp:
    const result = query instanceof RegExp ? processRegexp(query) : query
    return [result]
  }
  const serializedOptions = Object.entries(options).reduce((prev, curr) => {
    const val = curr[1]
    if (val !== undefined) {
      prev[curr[0]] = val instanceof RegExp ? processRegexp(val) : val
    }
    return prev
  }, {} as Record<string, string | boolean | SerializedRegexp>)

  return [query, serializedOptions]
}

export interface SerializedRegexp { type: 'regexp', value: string }

function processRegexp(regexp: RegExp): SerializedRegexp {
  // Make the regexp exact, to avoid multiple matches.
  // e.g. when you have buttons aria-labeled "right" and "top right", then the regex /right/ would match both.
  regexp = makeRegexpExact(regexp)

  return { type: 'regexp', value: regexp.toString() }
}

function makeRegexpExact(regexp: RegExp) {
  const { source, flags } = regexp

  // Wrap with ^ and $
  return new RegExp(`^${source}$`, flags)
}

function trackPendingInputChanges(shadowHost: HTMLDivElement, isRecording: () => boolean) {
  const isPendingInputChange = new ReactiveMap<Node, boolean>()
  function hasPendingInputChange() {
    return isPendingInputChange.size > 0
  }

  makeEventListener(shadowHost.shadowRoot!, 'input', (e) => {
    if (!(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
      return
    }
    isPendingInputChange.set(e.target, true)
  })
  makeEventListener(shadowHost.shadowRoot!, 'change', (e) => {
    if (!(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
      return
    }
    isPendingInputChange.delete(e.target)
  })

  const shadowHtml = shadowHost.shadowRoot?.children[0]
  if (shadowHtml) {
    createMutationObserver(shadowHtml, { subtree: true, childList: true }, (mutations) => {
      for (const mutation of mutations) {
        for (const removedNode of mutation.removedNodes) {
          isPendingInputChange.delete(removedNode)
        }
      }
    })
  }
  createEffect(() => {
    if (!isRecording()) {
      isPendingInputChange.clear()
    }
  })

  return {
    hasPendingInputChange,
  }
}
