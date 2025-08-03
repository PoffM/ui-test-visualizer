import { createSignal } from 'solid-js'
import { querySelectorAll as deepQuerySelectorAll } from 'kagekiri'
import { shadowHost } from '../App'
import type { InspectedNode } from '../inspector/inspector-dom-tree'

function searchTextInsideTree(tree: InspectedNode, query: string): Element[] {
  const nodes: Element[] = []

  const textNodes = tree.childNodes.filter(it => it.type === 'text')
  for (const textNode of textNodes) {
    if (textNode.text.toLowerCase().includes(query.toLowerCase()) && textNode.node.parentElement) {
      nodes.push(textNode.node.parentElement)
    }
  }

  const elementNodes = tree.childNodes.filter(it => it.type === 'element')
  for (const child of elementNodes) {
    nodes.push(...searchTextInsideTree(child, query))
  }

  if (tree.type === 'element' && tree.shadowRoot) {
    const shadowChildren = tree.shadowRoot.childNodes.filter(it => it.type === 'element')
    for (const child of shadowChildren) {
      nodes.push(...searchTextInsideTree(child, query))
    }
  }

  return nodes
}

export function createInspectorSearch() {
  const [searchQuery, setSearchQuery] = createSignal('')
  const [matchedNodes, setMatchedNodes] = createSignal<Element[]>([])
  const [currentNodeIndex, setCurrentNodeIndex] = createSignal(0)

  const handleSearch = (query: string, tree: InspectedNode | null) => {
    setSearchQuery(query)

    if (!query || !shadowHost.shadowRoot || !tree) {
      setMatchedNodes([])
      setCurrentNodeIndex(0)
      return
    }

    let nodes: Element[] = []
    // First try to find nodes by CSS selector
    try {
      nodes = deepQuerySelectorAll(query, shadowHost.shadowRoot)
    }
    catch (e) {}
    // If no nodes found, try to find nodes by text content
    if (nodes.length === 0) {
      nodes = searchTextInsideTree(tree, query)
    }
    setMatchedNodes(nodes)
    setCurrentNodeIndex(0)
  }

  const handleClearSearch = () => {
    handleSearch('', null)
  }

  const handleNext = () => {
    if (matchedNodes().length === 0) { return }
    const nextIndex = (currentNodeIndex() + 1) % matchedNodes().length
    setCurrentNodeIndex(nextIndex)
  }

  const handlePrev = () => {
    if (matchedNodes().length === 0) { return }
    const prevIndex = (currentNodeIndex() - 1 + matchedNodes().length) % matchedNodes().length
    setCurrentNodeIndex(prevIndex)
  }

  return {
    searchQuery,
    matchedNodes,
    currentNodeIndex,
    handleSearch,
    handleClearSearch,
    handleNext,
    handlePrev,
  }
}
