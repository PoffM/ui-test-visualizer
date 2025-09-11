import { createEffect, createSignal } from 'solid-js'
import { makeEventListener } from '@solid-primitives/event-listener'
import type { QueryArgs, Suggestion } from '@testing-library/dom'
import { getSuggestedQuery } from '@testing-library/dom'
import { deepElementFromPoint } from '../inspector/util'
import { client } from '../lib/panel-client'

export type InputEventType = 'click' | 'input' | 'submit' | 'focus' | 'blur'

export function createRecorder(shadowHost: HTMLDivElement) {
  const [isRecording, setIsRecording] = createSignal(false)

  createEffect(() => {
    if (isRecording()) {
      for (const eventType of ['click', 'input', 'submit', 'focus', 'blur'] as const) {
        makeEventListener(shadowHost.shadowRoot!, eventType, (e: Event) => {
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
          emitEvent(eventType, target)
        })
      }
    }
  })

  async function emitEvent(type: InputEventType, target: Element) {
    let suggestedQuery: Suggestion | undefined

    // Generate the selector using the closest HTMLElement.
    // e.g. if you click on an SVG, that doesn't count as an HTMLElement,
    // so step up to the parent.
    while (!suggestedQuery && target) {
      if (target instanceof HTMLElement) {
        suggestedQuery = getSuggestedQuery(target)
      }
      if (!suggestedQuery) {
        if (target.parentElement) {
          target = target.parentElement
        }
        else {
          return
        }
      }
    }

    if (!suggestedQuery) {
      return
    }

    const query = serializeQueryArgs(suggestedQuery.queryArgs)
    // Send the selector to the extension process to record as code
    await client.recordInputAsCode.mutate({
      event: type,
      query: [suggestedQuery.queryMethod, query],
    })
  }

  return {
    isRecording,
    toggle: (recording: boolean) => {
      setIsRecording(recording)
      console.log('recording:', recording)
    },
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
    const result = query instanceof RegExp ? serializeRegexp(query) : query
    return [result]
  }
  const serializedOptions = Object.entries(options).reduce((prev, curr) => {
    const val = curr[1]
    if (val !== undefined) {
      prev[curr[0]] = val instanceof RegExp ? serializeRegexp(val) : val
    }
    return prev
  }, {} as Record<string, string | boolean | SerializedRegexp>)

  return [query, serializedOptions]
}

export interface SerializedRegexp { type: 'regexp', value: string }

function serializeRegexp(regexp: RegExp): SerializedRegexp {
  return { type: 'regexp', value: regexp.toString() }
}
