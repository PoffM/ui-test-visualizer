import type { TRPCLink } from '@trpc/client'
import { TRPCClientError, createTRPCProxyClient } from '@trpc/client'
import { observable } from '@trpc/server/observable'

import { makeEventListener } from '@solid-primitives/event-listener'
import type { PanelRouter } from '../../../extension/panel-controller/panel-command-handler'
import { vscode } from './vscode'

/** TRPC link for calling from the VSCode webview to the VSCode Extension. */
const customLink: TRPCLink<PanelRouter> = () => {
  // here we just got initialized in the app - this happens once per app
  // useful for storing cache for instance
  return ({ op }) => {
    return observable((observer) => {
      vscode.postMessage({ path: op.path, id: op.id })

      const dispose = makeEventListener(window, 'message', (event) => {
        if (event.data.id === op.id) {
          if (event.data.error) {
            observer.error(new TRPCClientError(event.data.error))
            return
          }

          if (event.data.data) {
            dispose()
            observer.next({
              result: {
                type: 'data',
                data: event.data.data,
              },
            })
            observer.complete()
          }

          observer.error(new TRPCClientError('No data or error in response'))
        }
      })

      // You can return a cancel function here
      return () => {}
    })
  }
}

/** TRPC client for calling from the VSCode webview to the VSCode Extension. */
export const client = createTRPCProxyClient<PanelRouter>({
  links: [customLink],
})
