import type { DomClasses } from './mutable-dom-props'

export function containsNode(parent: Node, target: Node, win: DomClasses) {
  if (parent.contains(target)) {
    return true
  }

  const shadowRoots = findNestedShadowRoots(parent, win)
  for (const shadowRoot of shadowRoots) {
    if (containsNode(shadowRoot, target, win)) {
      return true
    }
  }

  return false
}

function findNestedShadowRoots(node: Node, win: DomClasses): ShadowRoot[] {
  const shadowRoots: ShadowRoot[] = []
  if (node instanceof win.Element && node.shadowRoot) {
    shadowRoots.push(node.shadowRoot)
  }

  const childNodes = node.childNodes
  for (let i = 0; i < childNodes.length; i++) {
    const child = childNodes[i]
    if (!child) {
      continue
    }
    shadowRoots.push(...findNestedShadowRoots(child, win))
  }

  return shadowRoots
}
