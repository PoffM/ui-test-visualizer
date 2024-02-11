import type { DomClasses } from '../primary/mutable-dom-props'
import type {
  SerializedCommentNode,
  SerializedDocumentFragment,
  SerializedDomElement,
  SerializedDomNode,
  SerializedTextNode,
} from '../types'

export function getNodeByPath(root: Node, path: number[]) {
  let currentElement: Node | undefined = root

  for (const index of path) {
    const children: ArrayLike<Node> = currentElement.nodeType === 9 // Check if the root node is Node.DOCUMENT_NODE
      ? (currentElement as Document).children
      : currentElement.childNodes

    currentElement = children?.[index]
    if (!currentElement) {
      throw new Error(`Node not found: ${path.join('.')}`)
    }
  }

  return currentElement
}

export function parseDomNode(node: SerializedDomNode, doc: Document, classes: DomClasses): Node {
  if (typeof node === 'string' || node === null) {
    return doc.createTextNode(node ?? '')
  }
  if (Array.isArray(node)) {
    if (node[0] === 'Text') {
      const [, text] = node as SerializedTextNode
      return doc.createTextNode(text ?? '')
    }
    if (node[0] === 'Comment') {
      const [, text] = node as SerializedCommentNode
      return doc.createComment(text ?? '')
    }
    if (node[0] === 'DocumentFragment') {
      const [, text] = node as SerializedDocumentFragment
      const frag = doc.createDocumentFragment()
      const parsedChildren = new classes.DOMParser()
        .parseFromString(text, 'text/html').body.childNodes
      frag.append(...Array.from(parsedChildren))
      return frag
    }

    const [tag, attributes, children] = node as SerializedDomElement
    const element = doc.createElement(tag)
    for (const [name, value] of Object.entries(attributes)) {
      element.setAttribute(name, value)
    }
    const parsedChildren = children.map(child => parseDomNode(child, doc, classes))
    element.append(...parsedChildren)
    return element
  }
  throw new Error(`Unhandled node type: ${node}`)
}
