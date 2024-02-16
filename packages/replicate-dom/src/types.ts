// Types used when syncing the DOM from a primary to a replica.

export type DomNodePath = (number | 'shadowRoot' | 'location')[]

export type SerializedDomTextNode = string | null

export type SerializedDomElement = [
  tagName: string,
  attributes: Record<string, string>,
  children: SerializedDomNode[],
  specialProps: NodeSpecialProps,
]

export interface NodeSpecialProps {
  namespaceURI?: string
  shadowRoot?: {
    init: ShadowRootInit
    content: SerializedDomNode
  }
}

export type SerializedTextNode = ['Text', string | null]

export type SerializedCommentNode = ['Comment', string]

export type SerializedDocumentFragment = ['DocumentFragment', SerializedDomNode[]]

export type SerializedShadowRoot = ['ShadowRoot', SerializedDomNode[]]

export type SerializedAttr = ['Attr', name: string, value: string, namespace?: string]

export type SerializedDomNode =
  | SerializedDomTextNode
  | SerializedDomElement
  | SerializedTextNode
  | SerializedCommentNode
  | SerializedDocumentFragment
  | SerializedShadowRoot
  | SerializedAttr

export interface HTMLPatch {
  targetNodePath: DomNodePath
  prop: string | string[]
  args: (DomNodePath | SerializedDomNode | { object: unknown })[]
}
