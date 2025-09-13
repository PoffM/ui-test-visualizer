import { makeEventListener } from '@solid-primitives/event-listener'
import type { QueryArgs, Suggestion } from '@testing-library/dom'
import { getSuggestedQuery } from '@testing-library/dom'
import { createEffect, createSignal } from 'solid-js'
import { deepElementFromPoint } from '../inspector/util'
import { client } from '../lib/panel-client'

export function createRecorder(shadowHost: HTMLDivElement) {
  const [isRecording, setIsRecording] = createSignal(false)

  createEffect(() => {
    if (isRecording()) {
      for (const eventType of ['click', 'submit', 'focus', 'blur', 'change'] as const) {
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

          const eventData: Parameters<typeof client.recordInputAsCode.mutate>[0]['eventData'] = {}

          if (eventType === 'change' && target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
            const text = target.value
            eventData.text = text
          }

          const query = serializeQueryArgs(suggestedQuery.queryArgs)
          // Send the selector to the extension process to record as code
          void client.recordInputAsCode.mutate({
            event: eventType,
            query: [suggestedQuery.queryMethod, query],
            eventData,
          })
        })
      }
    }
  })

  return {
    isRecording,
    toggle: (recording: boolean) => {
      setIsRecording(recording)
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
