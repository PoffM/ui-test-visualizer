import type { SpyImpl } from 'tinyspy'
import { spyOn } from 'tinyspy'
import type {
  DomNodePath,
  SerializedAttr,
  SerializedCommentNode,
  SerializedDocumentFragment,
  SerializedDomElement,
  SerializedDomNode,
  SerializedHTMLTemplateElement,
  SerializedShadowRoot,
  SerializedTextNode,
} from '../types'

export function getNodeByPath(root: Node, path: DomNodePath, win: typeof window) {
  let currentElement: Node | Location | undefined = root

  for (const index of path) {
    if (
      index === 'shadowRoot'
      && currentElement instanceof win.Element
      && currentElement.shadowRoot
    ) {
      currentElement = currentElement.shadowRoot
    }
    else if (
      index === 'content'
      && currentElement instanceof win.HTMLTemplateElement
    ) {
      currentElement = currentElement.content
    }
    else if (
      index === 'location'
      && (
        currentElement instanceof win.Document
        || currentElement instanceof win.HTMLDocument
      )
    ) {
      currentElement = currentElement.location
    }
    else if (
      typeof index === 'number'
      && currentElement instanceof win.Node
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
      case 'HTMLTemplateElement': {
        const [, content] = node as SerializedHTMLTemplateElement
        const template = doc.createElement('template')
        if (content) {
          const fragment = parseDomNode(content, doc, win)
          if (!(fragment instanceof win.DocumentFragment)) {
            throw new TypeError('Expected DocumentFragment')
          }

          template.content.append(...Array.from(fragment.childNodes))
        }
        return template
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

        // Don't execute scripts on the replica
        if (element instanceof win.HTMLScriptElement) {
          if (!element.type || element.type === 'text/javascript') {
            element.type = 'no-execute'
          }
          const setAttrSpy: SpyImpl<
            [name: string, val: string],
            void
          > = spyOn(
            element,
            'setAttribute',
            function (this: HTMLScriptElement, name, val) {
              if (name === 'type' && val === 'text/javascript') {
                val = 'no-execute'
              }

              return setAttrSpy.getOriginal()!.call(this, name, val)
            },
          )
        }

        const parsedChildren = children.map(child => parseDomNode(child, doc, win))
        element.append(...parsedChildren)
        return element
      }
    }
  }
  throw new Error(`Unhandled node type: ${node}`)
}
