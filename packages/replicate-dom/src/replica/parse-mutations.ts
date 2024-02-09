import type {
  SerializedDomElement,
  SerializedDomNode,
  SerializedTextNode,
} from '../types'

export function getNodeByPath(root: Node, path: number[]) {
  let currentElement: Node | undefined = root

  for (const index of path) {
    currentElement = currentElement?.childNodes?.[index]
    if (!currentElement) {
      return null
    }
  }

  return currentElement
}

export function parseDomNode(node: SerializedDomNode, doc: Document): Node {
  if (typeof node === 'string' || node === null) {
    return doc.createTextNode(node ?? '')
  }
  if (Array.isArray(node) && node[0] === 'Text') {
    const [, text] = node as SerializedTextNode
    return doc.createTextNode(text ?? '')
  }
  if (Array.isArray(node)) {
    const [tag, attributes, children] = node as SerializedDomElement
    const element = doc.createElement(tag)
    for (const [name, value] of Object.entries(attributes)) {
      element.setAttribute(name, value)
    }
    const parsedChildren = children.map(child => parseDomNode(child, doc))
    element.append(...parsedChildren)
    return element
  }
  throw new Error(`Unhandled node type: ${node}`)
}
