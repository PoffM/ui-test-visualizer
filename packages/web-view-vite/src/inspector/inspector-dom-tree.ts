import { createMutationObserver } from '@solid-primitives/mutation-observer'
import type { Accessor } from 'solid-js'
import { createSignal } from 'solid-js'
import { createStore, reconcile } from 'solid-js/store'
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
  attributes: Accessor<{ name: string, value: string }[]>
  childNodes: Accessor<InspectedNode[]>
  shadowRoot: Accessor<InspectedShadowRoot | null>
}

export interface InspectedText {
  type: 'text'
  node: Node
  text: Accessor<string>
  childNodes: Accessor<InspectedNode[]>
}

export interface InspectedShadowRoot {
  type: 'shadow-root'
  node: ShadowRoot
  shadowMode: ShadowRootMode
  childNodes: Accessor<InspectedNode[]>
}

function parseDOMTree(node: Node): InspectedNode {
  if (node instanceof Element) {
    const getAttributes = () => {
      return Array.from(node.attributes)
        .map(attr => ({ name: attr.name, value: attr.value }))
    }
    const [attributes, setAttributes] = createStore(getAttributes())
    createMutationObserver(node, { attributes: true }, () => {
      setAttributes(reconcile(getAttributes(), { key: 'name' }))
    })

    const getChildNodes = () => {
      return Array.from(node.childNodes)
        .map(child => parseDOMTree(child))
    }
    const [childNodes, setChildNodes] = createSignal(getChildNodes())
    updateChildrenOnChange(node, childNodes, setChildNodes)

    const getShadowRoot = (shadowRoot: ShadowRoot) => {
      const getChildNodes = () => {
        return Array.from(shadowRoot.childNodes)
          .map(child => parseDOMTree(child))
      }
      const [childNodes, setChildNodes] = createSignal(getChildNodes())
      updateChildrenOnChange(shadowRoot, childNodes, setChildNodes)
      return {
        type: 'shadow-root' as const,
        node: shadowRoot,
        shadowMode: shadowRoot.mode,
        childNodes,
      }
    }
    const [shadowRoot, setShadowRoot] = createSignal(
      node.shadowRoot ? getShadowRoot(node.shadowRoot) : null,
    )
    const originalAttach = node.attachShadow.bind(node)
    node.attachShadow = function (init) {
      const sr = originalAttach(init)
      setShadowRoot(getShadowRoot(sr))
      return sr
    }

    return {
      type: 'element',
      node,
      childNodes,
      shadowRoot,
      attributes: () => attributes,
    }
  }
  else {
    const [text, setText] = createSignal(node.textContent || '')
    createMutationObserver(node, { characterData: true }, () => {
      setText(node.textContent || '')
    })
    return {
      type: 'text',
      node,
      text,
      childNodes: () => [],
    }
  }
}

function updateChildrenOnChange(
  node: Node,
  lastChildren: () => InspectedNode[],
  callback: (newChildren: InspectedNode[]) => void,
) {
  createMutationObserver(node, { childList: true }, () => {
    const previousNodes = new Map<Node, InspectedNode>(
      lastChildren().map(n => [n.node, n]),
    )

    const newChildren = [...node.childNodes].map((child) => {
      const existingNode = previousNodes.get(child)
      if (existingNode) {
        return existingNode
      }
      return parseDOMTree(child)
    })

    callback(newChildren)
  })
}

export function getNewDomTree() {
  const shadowRoot = shadowHost?.shadowRoot
  const body = shadowRoot?.querySelector('body')
  if (!body) {
    return null
  }
  const tree = parseDOMTree(body)
  return tree
}

export function containsNode(trees: InspectedNode[] | null, node: Element): boolean {
  for (const tree of trees || []) {
    if (tree.type === 'text') { continue }

    if (tree.node === node) { return true }
    if (tree.childNodes()?.length && containsNode(tree.childNodes(), node)) { return true }
    if (tree.type === 'element' && tree.shadowRoot()?.childNodes()?.length && containsNode(tree.shadowRoot()?.childNodes() ?? null, node)) { return true }
  }
  return false
}
