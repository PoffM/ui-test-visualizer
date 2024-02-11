// Types used when syncing the DOM from a primary to a replica.

export type DomNodePath = number[]

export type SerializedDomTextNode = string | null

export type SerializedDomElement = [
  string,
  Record<string, string>,
  SerializedDomNode[],
]

export type SerializedTextNode = ['Text', string | null]

export type SerializedCommentNode = ['Comment', string]

export type SerializedDocumentFragment = ['DocumentFragment', string]

export type SerializedDomNode =
  | SerializedDomTextNode
  | SerializedDomElement
  | SerializedTextNode
  | SerializedCommentNode
  | SerializedDocumentFragment

export interface HTMLPatch {
  targetNodePath: DomNodePath
  prop: string | string[]
  args: (DomNodePath | SerializedDomNode)[]
}
