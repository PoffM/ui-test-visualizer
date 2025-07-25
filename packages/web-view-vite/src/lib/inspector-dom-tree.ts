import isEqual from 'lodash/isEqual'
import { shadowHost } from '../App'

export interface DOMTree {
  tagName: string
  textNodes: string | undefined
  attributes: { name: string, value: string }[]
  childTrees: DOMTree[]
  shadowTrees: DOMTree[] | null
  getBoundingClientRect: () => DOMRect
  node: Element
  isChanged: () => boolean
}

export function parseDOMTree(node: Element, previousTree: DOMTree | null): DOMTree {
  // Get all direct text nodes, excluding whitespace-only nodes
  const textNodes = Array.from(node.childNodes)
    .filter(child =>
      child.nodeType === Node.TEXT_NODE
      && child.textContent?.trim() !== '',
    )
    .map(node => node.textContent?.trim())
    .filter(Boolean)
    .join(' ')

  // Get all attributes
  const attributes = Array.from(node.attributes || [])
    .map(attr => ({ name: attr.name, value: attr.value }))

  const childTrees = Array.from(node.children)
    .map((child, idx) => parseDOMTree(child, previousTree?.childTrees?.[idx] ?? null))
  const shadowTrees = node.shadowRoot
    ? Array.from(node.shadowRoot.children).map((child, idx) => parseDOMTree(child, previousTree?.shadowTrees?.[idx] ?? null))
    : null

  let isChanged = !!previousTree && !isEqual(previousTree, {
    childTrees,
    shadowTrees,
    textNodes,
    attributes,
  })

  return {
    tagName: node.tagName.toLowerCase(),
    childTrees,
    shadowTrees,
    textNodes,
    attributes,
    node,
    isChanged: () => {
      const changed = isChanged
      isChanged = false
      return changed
    },
    getBoundingClientRect: () => node.getBoundingClientRect(),
  }
}

export function getNewDomTree(previousTree: DOMTree | null) {
  const shadowRoot = shadowHost?.shadowRoot
  if (!shadowRoot) {
    return null
  }
  const tree = parseDOMTree(shadowRoot.querySelector('body')!, previousTree)
  return tree
}

export function containsNode(trees: DOMTree[] | null, node: Element): boolean {
  for (const tree of trees || []) {
    if (tree.node === node) { return true }
    if (tree.childTrees?.length && containsNode(tree.childTrees, node)) { return true }
    if (tree.shadowTrees?.length && containsNode(tree.shadowTrees, node)) { return true }
  }
  return false
}
