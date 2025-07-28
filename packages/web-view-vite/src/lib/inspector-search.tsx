import { createSignal } from 'solid-js'
import { shadowHost } from '../App'
import type { DOMTree } from './inspector-dom-tree'

function searchTextInsideTree(tree: DOMTree, query: string): Element[] {
  const nodes: Element[] = []
  if (tree.textNodes?.toLowerCase().includes(query.toLowerCase())) {
    nodes.push(tree.node)
  }
  for (const child of tree.childTrees) {
    nodes.push(...searchTextInsideTree(child, query))
  }
  return nodes
}

export function createInspectorSearch() {
  const [searchQuery, setSearchQuery] = createSignal('')
  const [matchedNodes, setMatchedNodes] = createSignal<Element[]>([])
  const [currentNodeIndex, setCurrentNodeIndex] = createSignal(0)

  const handleSearch = (query: string, tree: DOMTree | null) => {
    setSearchQuery(query)

    if (!query || !shadowHost.shadowRoot || !tree) {
      setMatchedNodes([])
      setCurrentNodeIndex(0)
      return
    }

    let nodes: Element[] = []
    // First try to find nodes by CSS selector
    try {
      nodes = Array.from(shadowHost.shadowRoot.querySelectorAll(query))
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
