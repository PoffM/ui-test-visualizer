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

export function getNodeByPath(root: Node, path: DomNodePath, classes: typeof window) {
  let currentElement: Node | Location | undefined = root

  for (const index of path) {
    if (
      index === 'shadowRoot'
      && currentElement instanceof classes.Element
      && currentElement.shadowRoot
    ) {
      currentElement = currentElement.shadowRoot
    }
    else if (
      index === 'location'
      && (
        currentElement instanceof classes.Document
        || currentElement instanceof classes.HTMLDocument
      )
    ) {
      currentElement = currentElement.location
    }
    else if (
      typeof index === 'number'
      && currentElement instanceof classes.Node
    ) {
      // Check if the root node is Node.DOCUMENT_NODE
      const childProp = currentElement.nodeType === 9 ? 'children' : 'childNodes'
      // @ts-expect-error "children" exists when the node is a Document
      const children: ArrayLike<Node> = currentElement[childProp]
      currentElement = children[index]
    }
    if (!currentElement) {
      throw new Error(`Node not found: ${path.join('.')}`)
    }
  }

  return currentElement
}

export function parseDomNode(node: SerializedDomNode, doc: Document, win: typeof window): Node {
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
          .map(child => parseDomNode(child, doc, win))
        frag.append(...parsedChildren)
        return frag
      }
      case 'ShadowRoot': {
        const [, serializedChildren] = node as SerializedShadowRoot
        const frag = doc.createDocumentFragment()
        const parsedChildren = serializedChildren
          .map(child => parseDomNode(child, doc, win))
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
          const content = parseDomNode(specialProps.shadowRoot.content, doc, win)
          shadowRoot.append(content)
        }

        for (const [name, value] of Object.entries(attributes)) {
          element.setAttribute(name, value)
        }
        const parsedChildren = children.map(child => parseDomNode(child, doc, win))
        element.append(...parsedChildren)
        return element
      }
    }
  }
  throw new Error(`Unhandled node type: ${node}`)
}
