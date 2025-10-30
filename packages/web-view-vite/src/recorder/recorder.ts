import { makeEventListener } from '@solid-primitives/event-listener'
import { ReactiveMap } from '@solid-primitives/map'
import { createMutationObserver } from '@solid-primitives/mutation-observer'
import type { EventType, QueryArgs, Suggestion } from '@testing-library/dom'
import { getSuggestedQuery, queries } from '@testing-library/dom'
import type { userEvent } from '@testing-library/user-event'
import type { inferProcedureInput } from '@trpc/server'
import { createEffect, createSignal } from 'solid-js'
import type { z } from 'zod/mini'
import type { ExpectStatementType, PanelRouter, TestingLibraryQueryArgs, zRecordedEventData } from '../../../extension/src/panel-controller/panel-router'
import type { RecorderCodeInsertions } from '../../../extension/src/recorder/recorder-codegen-session'
import { openPanel, updateOpenPanel } from '../App'
import { deepElementFromPoint } from '../inspector/util'
import { client } from '../lib/panel-client'

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

  /** Generate a line of test code for the given user input event. */
  async function submitRecorderInputEvent(
    target: Element,
    eventType: string,
    { useExpect, enterKeyPressed, useFireEvent, processInput }: {
      useExpect?: ExpectStatementType
      enterKeyPressed?: boolean
      useFireEvent?: boolean
      processInput?: (input: inferProcedureInput<PanelRouter['recordInputAsCode']>) => inferProcedureInput<PanelRouter['recordInputAsCode']>
    } = {},
  ) {
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
    if (enterKeyPressed) {
      eventData.enterKeyPressed = true
    }

    // On text input change
    if (eventType === 'change') {
      if (target instanceof HTMLTextAreaElement || target instanceof HTMLInputElement) {
        if (target.type === 'text') {
          const text = target.value
          eventData.text = text
          eventData.clearBeforeType = focusedInputHadText
        }
      }
    }

    const root = rootElement()
    if (!root) {
      return
    }

    // Check if the query returns multiple elements
    await (async () => {
      try {
        const method = `findAllBy${suggestedQuery.queryName}`
        // @ts-expect-error Method should exist
        const results = await queries[method](
          root,
          ...suggestedQuery.queryArgs,
        )
        if (results.length > 1) {
          eventData.indexIfMultipleFound = results.indexOf(target)
        }
      }
      catch (error) {
        // Do nothing?
      }
    })()

    const recordedEventType = (() => {
      if (eventType === 'change' && target instanceof HTMLSelectElement) {
        eventData.options = [target.value]
        return 'selectOptions'
      }

      return eventType
    })()

    const queryArgs: TestingLibraryQueryArgs = [
      suggestedQuery.queryMethod,
      serializeQueryArgs(suggestedQuery.queryArgs),
    ]

    let input: inferProcedureInput<PanelRouter['recordInputAsCode']> = {
      event: recordedEventType,
      query: queryArgs,
      eventData,
      useExpect,
      useFireEvent,
    }

    input = processInput?.(input) ?? input

    // Send the selector to the extension process to record as code
    const insertions = await client.recordInputAsCode.mutate(input)
    setCodeInsertions(insertions)
  }

  let focusedInputHadText = false

  // When recording, listen to events in the shadow root and generate code for them.
  createEffect(() => {
    const root = rootElement()
    if (!root) {
      return
    }
    if (isRecording()) {
      // Check if a focused input has text before you start typing into it
      makeEventListener(root, 'focus', (e: Event) => {
        const target = e.target
        if (
          (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement)
          && target.value
        ) {
          focusedInputHadText = true
        }
      }, { capture: true })

      // Capture input events to be recorded as test code
      for (const eventType of ['click', 'submit', 'change', 'keydown'] as const) {
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

          if (
            (target instanceof HTMLTextAreaElement || target instanceof HTMLInputElement)
            && (target.type === 'checkbox' || target.type === 'radio')
            && eventType === 'change'
          ) {
            e.preventDefault()
            return // generate code for the 'click' event, not 'change'
          }

          let enterKeyPressed = false
          if (eventType === 'keydown') {
            if (e instanceof KeyboardEvent && target instanceof HTMLInputElement && e.key === 'Enter') {
              enterKeyPressed = true
              target.blur()
              await new Promise(resolve => setTimeout(resolve, 0))
              target.focus()
            }
            else {
              // Ignore other key presses
              return
            }
          }

          // On alt-click, generate the 'minimal' expect statement
          // e.g. `expect(screen.getByRole('button'))`
          const useExpect = (eventType === 'click' && e instanceof MouseEvent && e.altKey)
            ? 'minimal'
            : undefined
          // When the 'alt' key is held while clicking, generate an 'expect' statement
          if (useExpect) {
            e.preventDefault()
          }

          await submitRecorderInputEvent(target, eventType, { useExpect, enterKeyPressed })
        })
      }
    }
    else {
      makeEventListener(root, 'beforeinput', (e) => {
        // Block changing inputs when not recording
        e.preventDefault()
      })
      makeEventListener(root, 'click', (e) => {
        if (e.target instanceof HTMLInputElement) {
          // Block changing inputs like checkboxes and radios when not recording
          e.preventDefault()
        }
      })
    }
  })

  return {
    isRecording,
    toggle: (recording: boolean) => {
      updateOpenPanel(recording ? 'recorder' : null)
    },
    removeInsertion: async (line: number, idx?: number) => {
      const newInsertions = await client.removeRecorderInsertion.mutate({ line, idx })
      setCodeInsertions(newInsertions)
    },
    codeInsertions,
    hasPendingInputChange,
    submitRecorderInputEvent,
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
