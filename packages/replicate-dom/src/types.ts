// Types used when syncing the DOM from a primary to a replica.

export type DomNodePath = number[]

export type SerializedDomTextNode = string | null

export type SerializedDomElement = [
  tagName: string,
  attributes: Record<string, string>,
  children: SerializedDomNode[],
  specialProps: {
    namespaceURI?: string
    shadowRoot?: {
      init: ShadowRootInit
    }
  },
]

export type SerializedTextNode = ['Text', string | null]

export type SerializedCommentNode = ['Comment', string]

export type SerializedDocumentFragment = ['DocumentFragment', string]

export type SerializedAttr = ['Attr', name: string, value: string, namespace?: string]

export type SerializedDomNode =
  | SerializedDomTextNode
  | SerializedDomElement
  | SerializedTextNode
  | SerializedCommentNode
  | SerializedDocumentFragment
  | SerializedAttr

export interface HTMLPatch {
  targetNodePath: DomNodePath
  prop: string | string[]
  args: (DomNodePath | SerializedDomNode | { object: unknown })[]
}
