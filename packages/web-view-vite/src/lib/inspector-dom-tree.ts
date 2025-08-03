import { shadowHost } from '../App'

/**
 * The node wrapped in metadata for the Inspector UI.
 * The 'node' property acts as the 'key' for Soild's 'reconcile' function.
 * Other properties (attributes, children, etc.) are copied from the node to this
 * object so Solid treats them as reactive signals.
 */
export type InspectedNode = InspectedElement | InspectedText | InspectedShadowRoot

export interface InspectedElement {
  type: 'element'
  node: Element
  tagName: string
  attributes: { name: string, value: string }[]
  childNodes: InspectedNode[]
  shadowRoot: InspectedShadowRoot | null
  getBoundingClientRect: () => DOMRect | null
}

export interface InspectedText {
  type: 'text'
  node: Node
  text: string
  childNodes: InspectedNode[]
  getBoundingClientRect: () => DOMRect | null
}

export interface InspectedShadowRoot {
  type: 'shadow-root'
  node: ShadowRoot
  childNodes: InspectedNode[]
  getBoundingClientRect: () => null
}

function parseDOMTree(node: Node): InspectedNode {
  if (node instanceof Element) {
    // Get all attributes
    const attributes = Array.from(node.attributes || [])
      .map(attr => ({ name: attr.name, value: attr.value }))

    const childNodes = Array.from(node.childNodes)
      .map(child => parseDOMTree(child))
      .filter(Boolean)

    const shadowRoot: InspectedShadowRoot | null = node.shadowRoot
      ? {
          type: 'shadow-root',
          node: node.shadowRoot,
          childNodes: Array.from(node.shadowRoot.childNodes || [])
            .map(child => parseDOMTree(child))
            .filter(Boolean),
          getBoundingClientRect: () => null,
        }
      : null

    return {
      type: 'element',
      node,
      tagName: node.tagName.toLowerCase(),
      childNodes,
      shadowRoot,
      attributes,
      getBoundingClientRect: () => node.getBoundingClientRect(),
    }
  }
  else {
    return {
      type: 'text',
      node,
      text: node.textContent || '',
      childNodes: [],
      getBoundingClientRect: () => node.parentElement?.getBoundingClientRect() ?? null,
    }
  }
}

export function getNewDomTree() {
  const shadowRoot = shadowHost?.shadowRoot
  if (!shadowRoot) {
    return null
  }
  const tree = parseDOMTree(shadowRoot.querySelector('body')!)
  return tree
}

export function containsNode(trees: InspectedNode[] | null, node: Element): boolean {
  for (const tree of trees || []) {
    if (tree.type === 'text') { continue }

    if (tree.node === node) { return true }
    if (tree.childNodes?.length && containsNode(tree.childNodes, node)) { return true }
    if (tree.type === 'element' && tree.shadowRoot?.childNodes?.length && containsNode(tree.shadowRoot?.childNodes, node)) { return true }
  }
  return false
}
