import type { DomNodePath, NodeSpecialProps, SerializedDomNode } from '../types'
import { containsNode } from './contains-node-util'
import type { DomClasses } from './mutable-dom-props'

export function getNodePath(node: Node, root: Node, classes: DomClasses): DomNodePath | null {
  const indices: DomNodePath = []
  let currentNode = node

  // Traverse up the tree until the root node is reached
  while (currentNode && currentNode !== root) {
    if (currentNode.parentNode) {
      const parent = currentNode.parentNode

      // When the parent is the root, use "children" instead of "childNodes"
      // to ignore the "<!DOCTYPE html>" node.
      const siblings = parent === root ? parent.children : parent.childNodes

      let index = Array.prototype.indexOf.call(siblings, currentNode)

      if (index === -1) {
        index = 0
      }

      indices.unshift(index) // Add the index to the beginning of the array
      currentNode = parent
      continue
    }

    if (currentNode instanceof classes.ShadowRoot && currentNode.host) {
      indices.unshift('shadowRoot')
      currentNode = currentNode.host
      continue
    }

    if (
      currentNode instanceof classes.Location
      && (root instanceof classes.Document
      || root instanceof classes.HTMLDocument)
      && root.location === currentNode
    ) {
      indices.unshift('location')
      currentNode = root
      continue
    }

    return null
  }

  // If the root node is not an ancestor of the node, return null
  if (currentNode !== root) {
    return null
  }

  return indices
}

/**
 * Returns a serialized representation of a DOM node or a string.
 * When the node is an existing DOM node, it returns a path to the node.
 */
export function serializeDomMutationArg(
  arg: string | Node | null,
  root: Node,
  classes: DomClasses,
): DomNodePath | SerializedDomNode | { object: unknown } {
  if (
    typeof arg === 'string'
    || typeof arg === 'number'
    || typeof arg === 'boolean'
    || arg === null
  ) {
    return arg
  }
  // Existing nodes are referenced by their numeric path,
  // so the receiver can look them up in its DOM
  if (arg instanceof classes.Node && containsNode(root, arg, classes)) {
    return getNodePath(arg, root, classes)
  }
  if (
    arg instanceof classes.Element
    || arg instanceof classes.Text
    || arg instanceof classes.Comment
    || arg instanceof classes.DocumentFragment
    || arg instanceof classes.Attr
  ) {
    return serializeDomNode(arg, classes)
  }
  if (typeof arg === 'object') {
    return { object: JSON.parse(JSON.stringify(arg)) }
  }
  throw new Error(`Unknown node type: ${JSON.stringify(arg)}`)
}

function serializeDomNode(node: Node, classes: DomClasses): SerializedDomNode {
  if (node instanceof classes.Text) {
    return ['Text', node.textContent]
  }
  if (node instanceof classes.Comment) {
    return ['Comment', node.data]
  }
  if (node instanceof classes.DocumentFragment) {
    return [
      'DocumentFragment',
      Array.from(node.childNodes).map(node => serializeDomNode(node, classes)),
    ]
  }
  if (node instanceof classes.ShadowRoot) {
    return [
      'ShadowRoot',
      Array.from(node.childNodes).map(node => serializeDomNode(node, classes)),
    ]
  }
  if (node instanceof classes.Attr) {
    return ['Attr', node.name, node.value, node.namespaceURI ?? undefined]
  }
  else if (node instanceof classes.Element) {
    const attributes: Record<string, string> = {}
    for (const attr of Array.from(node.attributes)) {
      attributes[attr.name] = attr.value
    }

    const specialProps: NodeSpecialProps = (() => {
      const result: NodeSpecialProps = {}

      if (node.shadowRoot) {
        result.shadowRoot = {
          init: {
            mode: 'open',
            delegatesFocus: node.shadowRoot.delegatesFocus,
            slotAssignment: node.shadowRoot.slotAssignment,
          },
          content: serializeDomNode(node.shadowRoot, classes),
        }
      }
      // Special case for SVG elements or others that use a namespace.
      // Remove this attribute on the receiver side, as it's not a real attribute.
      if (node.namespaceURI && node.namespaceURI !== DEFAULT_NS) {
        result.namespaceURI = node.namespaceURI
      }

      return result
    })()

    const children = Array.from(node.childNodes)
      .map(node => serializeDomNode(node, classes))

    return [
      node.tagName.toLowerCase(),
      attributes,
      children,
      specialProps,
    ]
  }
  throw new Error(`Unhandled node type: ${node.nodeType}`)
}

const DEFAULT_NS = 'http://www.w3.org/1999/xhtml'
