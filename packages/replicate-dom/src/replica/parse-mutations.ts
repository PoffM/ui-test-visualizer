import type { DomClasses } from '../primary/mutable-dom-props'
import type {
  DomNodePath,
  SerializedAttr,
  SerializedCommentNode,
  SerializedDocumentFragment,
  SerializedDomElement,
  SerializedDomNode,
  SerializedShadowRoot,
  SerializedTextNode,
} from '../types'

export function getNodeByPath(root: Node, path: DomNodePath, classes: DomClasses) {
  let currentElement: Node | undefined = root

  for (const index of path) {
    currentElement = ((): Node | undefined => {
      if (
        index === 'shadowRoot'
        && currentElement instanceof classes.Element
        && currentElement.shadowRoot
      ) {
        return currentElement.shadowRoot
      }
      if (typeof index === 'number') {
        const children: ArrayLike<Node> = currentElement.nodeType === 9 // Check if the root node is Node.DOCUMENT_NODE
          ? (currentElement as Document).children
          : currentElement.childNodes
        return children[index]
      }
      throw new Error(`Invalid path index: ${index}`)
    })()

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
    switch (node[0]) {
      case 'Text': {
        const [, text] = node as SerializedTextNode
        return doc.createTextNode(text ?? '')
      }
      case 'Comment': {
        const [, text] = node as SerializedCommentNode
        return doc.createComment(text ?? '')
      }
      case 'Attr': {
        const [, name, value, namespace] = node as SerializedAttr
        const attr = namespace
          ? doc.createAttributeNS(namespace, name)
          : doc.createAttribute(name)
        attr.value = value
        return attr
      }
      case 'DocumentFragment': {
        const [, serializedChildren] = node as SerializedDocumentFragment
        const frag = doc.createDocumentFragment()
        const parsedChildren = serializedChildren
          .map(child => parseDomNode(child, doc, classes))
        frag.append(...parsedChildren)
        return frag
      }
      case 'ShadowRoot': {
        const [, serializedChildren] = node as SerializedShadowRoot
        const frag = doc.createDocumentFragment()
        const parsedChildren = serializedChildren
          .map(child => parseDomNode(child, doc, classes))
        frag.append(...parsedChildren)
        return frag
      }
      default: {
        const [
          tag,
          attributes,
          children,
          specialProps,
        ] = node as SerializedDomElement

        const element = (() => {
          if (specialProps.namespaceURI) {
            return doc.createElementNS(specialProps.namespaceURI, tag)
          }
          return doc.createElement(tag)
        })()

        if (specialProps.shadowRoot) {
          const shadowRoot = element.attachShadow(specialProps.shadowRoot.init)
          const content = parseDomNode(specialProps.shadowRoot.content, doc, classes)
          shadowRoot.append(content)
        }

        for (const [name, value] of Object.entries(attributes)) {
          element.setAttribute(name, value)
        }
        const parsedChildren = children.map(child => parseDomNode(child, doc, classes))
        element.append(...parsedChildren)
        return element
      }
    }
  }
  throw new Error(`Unhandled node type: ${node}`)
}
