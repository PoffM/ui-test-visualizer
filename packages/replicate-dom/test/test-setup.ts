import { DocumentFragment } from 'happy-dom'
import type { Document, HTMLElement, Window as HWindow } from 'happy-dom'
import { applyDomPatch, initPrimaryDom } from '../src'
import { getNodePath } from '../src/primary/serialize'
import { getNodeByPath } from '../src/replica/parse'

export function initTestReplicaDom(
  primaryWindow: Window | HWindow,
  replicaWindow: Window | HWindow,
) {
  initPrimaryDom({
    onMutation(htmlPatch) {
      applyDomPatch(
        replicaWindow.document as unknown as Node,
        htmlPatch,
        replicaWindow as unknown as Window & typeof globalThis,
      )
    },
    root: primaryWindow.document as unknown as Node,
    win: primaryWindow as unknown as typeof globalThis.window,
  })
}

type NodeCreateMethod = keyof {
  [
  P in keyof Document as Document[P] extends ((arg: string) => any)
    ? P
    : never
  ]: Document[P]
}

export function addTestElement<
  R = HTMLElement,
  M extends NodeCreateMethod = 'createElement',
>(
  primaryDocument: Document,
  replicaDocument: Document,
  arg: string,
  method: M = 'createElement' as M,
) {
  const numArgs = primaryDocument[method].length
  const testEl = numArgs ? primaryDocument[method](arg) : primaryDocument[method]()

  const primary = (() => {
    if (testEl instanceof DocumentFragment) {
      testEl.append(primaryDocument.createElement('div'))
      primaryDocument.body.appendChild(
        testEl,
      )
      return primaryDocument.body.firstElementChild
    }
    return primaryDocument.body.appendChild(
      testEl,
    )
  })()

  const path = getNodePath(
    primary as unknown as Node,
    primaryDocument as unknown as Node,
    primaryDocument.defaultView as unknown as typeof globalThis.window,
  )
  if (!path) {
    throw new Error('Node not found in original document')
  }
  const replica = getNodeByPath(
    replicaDocument as unknown as Node,
    path,
    replicaDocument.defaultView as unknown as typeof globalThis.window,
  )
  if (!replica) {
    throw new Error(`Node not found in replica document at ${path}`)
  }

  type Return =
     M extends 'createElement' ? unknown extends R ? HTMLElement : R
       : M extends 'createTextNode' ? Text
         : ReturnType<Document[M]>

  return {
    primary: primary as unknown as Return,
    replica: replica as unknown as Return,
  }
}
