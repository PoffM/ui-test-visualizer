import type { Window } from 'happy-dom'
import type { DomNodePath, NodeSpecialProps, SerializedDomMutationArg, SerializedDomNode, SpyableClass } from '../types'
import { containsNode, findNestedAltRoots } from './contains-node-util'

export function getNodePath(node: SpyableClass, root: Node, win: typeof window): DomNodePath | null {
  const indices: DomNodePath = []
  let currentNode = node

  // Traverse up the tree until the root node is reached
  while (currentNode && currentNode !== root) {
    if (currentNode instanceof win.Location) {
      if (!(root instanceof win.Document || root instanceof win.HTMLDocument)) {
        throw new TypeError('Cannot find given Location\'s parent, given \'root\' is not a Document or HTMLDocument.')
      }
      if (root.location !== currentNode) {
        throw new Error('Given Location is not a child of the root node.')
      }
      indices.unshift('location')
      currentNode = root
      continue
    }

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

    if (currentNode instanceof win.ShadowRoot && currentNode.host) {
      indices.unshift('shadowRoot')
      currentNode = currentNode.host
      continue
    }

    if (currentNode instanceof win.DocumentFragment) {
      const altRoots = findNestedAltRoots(win.document, win)
      const altRoot = altRoots.find(({ child }) => child === currentNode)
      if (!altRoot) {
        throw new Error('Can\'t find DocumentFragmen\'s parent node.')
      }

      indices.unshift('content')

      const { parent } = altRoot
      currentNode = parent

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
  win: typeof window,
): SerializedDomMutationArg {
  if (
    typeof arg === 'string'
    || typeof arg === 'number'
    || typeof arg === 'boolean'
    || arg === null
  ) {
    return arg
  }
  if (arg === undefined) {
    return ['Undefined']
  }
  if (arg instanceof Date) {
    return ['Date', arg.getTime()]
  }
  if (arg instanceof win.File) {
    return ['File', {
      name: arg.name,
      type: arg.type,
      lastModified: arg.lastModified,
    }]
  }
  // Existing nodes are referenced by their numeric path,
  // so the receiver can look them up in its DOM
  if (arg instanceof win.Node && containsNode(root, arg, win)) {
    return getNodePath(arg, root, win)
  }
  if (
    arg instanceof win.Element
    || arg instanceof win.Text
    || arg instanceof win.Comment
    || arg instanceof win.DocumentFragment
    || arg instanceof win.Attr
  ) {
    return serializeDomNode(arg, win)
  }
  if (typeof arg === 'object') {
    return { object: JSON.parse(JSON.stringify(arg)) }
  }
  throw new Error(`Unknown node type: ${JSON.stringify(arg)}`)
}

export function serializeDomNode(
  node: Node,
  win: typeof window | Window,
): SerializedDomNode {
  if (node instanceof win.Text) {
    return ['Text', node.data]
  }
  if (node instanceof win.Comment) {
    return ['Comment', node.data]
  }
  if (node instanceof win.DocumentFragment) {
    return [
      'DocumentFragment',
      Array.from(node.childNodes).map(node => serializeDomNode(node, win)),
    ]
  }
  if (node instanceof win.ShadowRoot) {
    return [
      'ShadowRoot',
      Array.from(node.childNodes).map(node => serializeDomNode(node, win)),
    ]
  }
  if (node instanceof win.HTMLTemplateElement) {
    return [
      'HTMLTemplateElement',
      node.content && serializeDomNode(node.content, win),
    ]
  }
  if (node instanceof win.Attr) {
    return ['Attr', node.name, node.value, node.namespaceURI ?? undefined]
  }
  else if (node instanceof win.Element) {
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
          content: serializeDomNode(node.shadowRoot, win),
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
      .map(node => serializeDomNode(node, win))

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
