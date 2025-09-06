import { createEffect, createSignal } from 'solid-js'
import { createEventListener } from '@solid-primitives/event-listener'
import type { QueryArgs } from '@testing-library/dom'
import { getSuggestedQuery } from '@testing-library/dom'
import { deepElementFromPoint } from '../inspector/util'
import { client } from '../lib/panel-client'
// import { SelectorComputer } from './selector-gen/SelectorComputer'

export function createRecorder(shadowHost: HTMLDivElement) {
  const [isRecording, setIsRecording] = createSignal(false)

  createEffect(() => {
    if (isRecording()) {
      createEventListener(shadowHost.shadowRoot!, 'click', (e: Event) => {
        if (!(e instanceof MouseEvent)) {
          return
        }
        const clickedEl = (shadowHost.shadowRoot && deepElementFromPoint(shadowHost.shadowRoot, e.clientX, e.clientY)) ?? e.target
        if (!(clickedEl instanceof Element)) {
          return
        }
        emitEvent('click', clickedEl)
      })
    }
  })

  async function emitEvent(type: 'click', target: Element) {
    console.log('target', target)

    // TODO Do I need this?
    // const selectors = selectorComputer.getSelectors(target)
    // console.log('selector', selectors)

    if (target instanceof HTMLElement) {
      // Generate the selector
      const suggestedQuery = getSuggestedQuery(target)
      if (suggestedQuery) {
        const queryArgs = serializeQueryArgs(suggestedQuery.queryArgs)
        // Send the selector to the extension process to record as code
        await client.recordInputAsCode.mutate({
          event: type,
          query: [
            suggestedQuery.queryMethod,
            queryArgs,
          ],
        })
      }
    }
    if (type === 'click') {
      console.log('click', target)
    }
  }

  return {
    isRecording,
    toggle: (recording: boolean) => {
      setIsRecording(recording)
      console.log('recording:', recording)
    },
  }
}

// const selectorComputer = new SelectorComputer({
//   getAccessibleName: (node: Node) => {
//     if (node instanceof Element) {
//       const label = node.getAttribute('aria-label')
//       const labelledby = node.getAttribute('aria-labelledby')

//       if (label) { return label }
//       if (labelledby) { return document.getElementById(labelledby)?.textContent ?? '' }
//     }
//     return node.textContent ?? ''
//   },
//   getAccessibleRole: (node: Node) => {
//     if (node instanceof Element) {
//       return node.getAttribute('role') ?? ''
//     }
//     return ''
//   },
// })

export function serializeQueryArgs(queryArgs: QueryArgs): [string, { [key: string]: string | boolean }?] {
  const [query, options] = queryArgs
  if (!options) { return [query] }
  const serializedOptions = Object.entries(options).reduce((prev, curr) => {
    const val = curr[1]
    if (val !== undefined) {
      prev[curr[0]] = String(curr[1])
    }
    return prev
  }, {} as Record<string, string | boolean>)

  return [query, serializedOptions]
}
