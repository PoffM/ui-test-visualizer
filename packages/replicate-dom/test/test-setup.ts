import type { HTMLElement, IDocument, INode, IWindow } from 'happy-dom'
import { applyDomPatch, initPrimaryDom } from '../src'
import { getNodePath } from '../src/primary/serialize-mutations'
import { getNodeByPath } from '../src/replica/parse-mutations'

export function initTestReplicaDom(
  primaryWindow: IWindow | Window,
  replicaDocument: IDocument | Document,
) {
  initPrimaryDom({
    onMutation(htmlPatch) {
      applyDomPatch(replicaDocument as unknown as Node, htmlPatch)
    },
    root: primaryWindow.document as unknown as Node,
    classes: primaryWindow as unknown as typeof globalThis.window,
  })
}

export function addTestElement<
  M extends 'createElement' | 'createTextNode',
>(
  primaryDocument: IDocument,
  replicaDocument: INode,
  arg: string,
  method: M = 'createElement' as M,
) {
  const primary = primaryDocument.body.appendChild(
    primaryDocument[method](arg),
  )
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

  type Return = M extends 'createElement'
    ? HTMLElement
    : M extends 'createTextNode' ? Text : never

  return {
    primary: primary as unknown as Return,
    replica: replica as unknown as Return,
  }
}
