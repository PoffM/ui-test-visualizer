import { shadowHost } from '../App'

export interface DOMTree {
  tagName: string
  attributes: { name: string, value: string }[]
  childNodes: (DOMTree | string)[]
  shadowChildNodes: (DOMTree | string)[] | null
  getBoundingClientRect: () => DOMRect
  node: Element
}

function parseDOMTree(node: Element): DOMTree {
  // Get all attributes
  const attributes = Array.from(node.attributes || [])
    .map(attr => ({ name: attr.name, value: attr.value }))

  const childNodes = Array.from(node.childNodes)
    .map(child => child instanceof Element ? parseDOMTree(child) : child.textContent?.trim())
    .filter(Boolean)
  const shadowChildNodes = node.shadowRoot
    ? Array.from(node.shadowRoot.childNodes)
      .map(child => child instanceof Element ? parseDOMTree(child) : child.textContent?.trim())
      .filter(Boolean)
    : null

  return {
    tagName: node.tagName.toLowerCase(),
    childNodes,
    shadowChildNodes,
    attributes,
    node,
    getBoundingClientRect: () => node.getBoundingClientRect(),
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

export function containsNode(trees: (DOMTree | string)[] | null, node: Element): boolean {
  for (const tree of trees || []) {
    if (typeof tree === 'string') { continue }

    if (tree.node === node) { return true }
    if (tree.childNodes?.length && containsNode(tree.childNodes, node)) { return true }
    if (tree.shadowChildNodes?.length && containsNode(tree.shadowChildNodes, node)) { return true }
  }
  return false
}
