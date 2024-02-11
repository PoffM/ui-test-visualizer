import { DocumentFragment } from 'happy-dom'
import type { IDocument, IHTMLElement, INode, IWindow } from 'happy-dom'
import { applyDomPatch, initPrimaryDom } from '../src'
import { getNodePath } from '../src/primary/serialize-mutations'
import { getNodeByPath } from '../src/replica/parse-mutations'

export function initTestReplicaDom(
  primaryWindow: IWindow | Window,
  replicaWindow: IWindow | Window,
) {
  initPrimaryDom({
    onMutation(htmlPatch) {
      applyDomPatch(
        replicaWindow.document as unknown as Node,
        htmlPatch,
        replicaWindow as unknown as typeof globalThis,
      )
    },
    root: primaryWindow.document as unknown as Node,
    classes: primaryWindow as unknown as typeof globalThis.window,
  })
}

type NodeCreateMethod = keyof {
  [
  P in keyof IDocument as IDocument[P] extends ((arg: string) => any)
    ? P
    : never
  ]: IDocument[P]
}

export function addTestElement<
  M extends NodeCreateMethod,
>(
  primaryDocument: IDocument,
  replicaDocument: INode,
  arg: string,
  method: M = 'createElement' as M,
) {
  const numArgs = primaryDocument[method].length
  // @ts-expect-error The methods call should be valid
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
      // @ts-expect-error The element should be valid
      testEl,
    )
  })()

  const path = getNodePath(
    primary as unknown as Node,
    primaryDocument as unknown as Node,
  )
  if (!path) {
    throw new Error('Node not found in original document')
  }
  const replica = getNodeByPath(
    replicaDocument as unknown as Node,
    path,
  )
  if (!replica) {
    throw new Error(`Node not found in replica document at ${path}`)
  }

  type Return =
     M extends 'createElement' ? IHTMLElement
       : M extends 'createTextNode' ? Text
         : ReturnType<IDocument[M]>

  return {
    primary: primary as unknown as Return,
    replica: replica as unknown as Return,
  }
}
