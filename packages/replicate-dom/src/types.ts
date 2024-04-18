// Types used when syncing the DOM from a primary to a replica.

export type DomNodePath = (number | 'shadowRoot' | 'location' | 'content')[]

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
    adoptedStyleSheets: string[][]
  }
}

export type SerializedDomTextNode = string | null

export type SerializedTextNode = ['Text', string | null]

export type SerializedCommentNode = ['Comment', string]

export type SerializedDocumentFragment = ['DocumentFragment', SerializedDomNode[]]

export type SerializedShadowRoot = ['ShadowRoot', SerializedDomNode[]]

export type SerializedHTMLTemplateElement = ['HTMLTemplateElement', SerializedDomNode | null]

export type SerializedAttr = ['Attr', name: string, value: string, namespace?: string]

export type SerializedDomNode =
  | SerializedDomTextNode
  | SerializedDomElement
  | SerializedTextNode
  | SerializedCommentNode
  | SerializedDocumentFragment
  | SerializedShadowRoot
  | SerializedHTMLTemplateElement
  | SerializedAttr

export type SerializedDate = ['Date', number]
export type SerializedFile = ['File', { name: string, type: string, lastModified: number }]
export type SerializedUndefined = ['Undefined']

export type SerializedDomMutationArg =
  | DomNodePath
  | SerializedDomNode
  | SerializedDate
  | SerializedFile
  | SerializedUndefined
  | string
  | number
  | boolean
  | { object: unknown }

export type SpyableClass = Node | Location

export interface HTMLPatch {
  targetNodePath: DomNodePath
  prop: string | string[]
  args: SerializedDomMutationArg[]
}
