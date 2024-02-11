import type { SerializedDomNode } from '../types'
import type { DomClasses } from './mutable-dom-props'

export function getNodePath(node: Node, root: Node) {
  const indices = []
  let currentNode = node

  // Traverse up the tree until the root node is reached
  while (currentNode && currentNode !== root) {
    const parent = currentNode.parentNode

    if (!parent) {
      // If the parent is null, the node is not in the DOM
      return null
    }

    // When the parent is the root, use "children" instead of "childNodes" to ignore the "<!DOCTYPE html>" node.
    const siblings = parent === root ? parent.children : parent.childNodes

    let index = Array.prototype.indexOf.call(siblings, currentNode)

    if (index === -1) {
      index = 0
    }

    indices.unshift(index) // Add the index to the beginning of the array
    currentNode = parent
  }

  // If the root node is not an ancestor of the node, return null
  if (currentNode !== root) {
    return null
  }

  return indices
}

export function serializeDomMutationArg(
  arg: string | Node | null,
  root: Node,
  classes: DomClasses,
) {
  if (
    typeof arg === 'string'
    || typeof arg === 'number'
    || typeof arg === 'boolean'
  ) {
    return arg
  }
  if (arg === null) {
    return arg
  }
  // Existing nodes are referenced by their numeric path,
  // so the receiver can look them up in its DOM
  if (arg instanceof classes.Node && root.contains(arg)) {
    return getNodePath(arg, root)
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
  throw new Error(`Unknown node type: ${arg}`)
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
      new classes.XMLSerializer().serializeToString(node),
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
    // if (node.namespaceURI) {
    //   attributes.namespaceURI = node.namespaceURI
    // }

    const children = Array.from(node.childNodes)
      .map(node => serializeDomNode(node, classes))

    return [node.tagName.toLowerCase(), attributes, children]
  }
  throw new Error(`Unhandled node type: ${node.nodeType}`)
}
