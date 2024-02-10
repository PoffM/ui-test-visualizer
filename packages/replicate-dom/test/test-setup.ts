import type { HTMLElement, IDocument, IWindow } from 'happy-dom'
import { applyDomPatch, initPrimaryDom } from '../src'
import { getNodePath } from '../src/primary/serialize-mutations'
import { getNodeByPath } from '../src/replica/parse-mutations'

export function initTestReplicaDom(
  primaryWindow: IWindow,
  replicaDocument: IDocument,
) {
  initPrimaryDom({
    onMutation(htmlPatch) {
      applyDomPatch(replicaDocument as unknown as Node, htmlPatch)
    },
    root: primaryWindow.document as unknown as Node,
    classes: primaryWindow as unknown as typeof globalThis.window,
  })
}

export function addTestElement(
  primaryDocument: Document,
  replicaDocument: Node,
  type: string,
) {
  const primary = primaryDocument.body.appendChild(
    primaryDocument.createElement(type),
  )
  const path = getNodePath(
    primary as unknown as Node,
    primaryDocument as unknown as Node,
  )
  if (!path) {
    throw new Error('Node not found in original document')
  }
  const replica = getNodeByPath(replicaDocument, path)
  if (!replica) {
    throw new Error(`Node not found in replica document at ${path}`)
  }

  return {
    primary: primary as unknown as HTMLElement,
    replica: replica as unknown as HTMLElement,
  }
}
