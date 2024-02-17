export function containsNode(parent: Node, target: Node | Location, win: typeof window): boolean {
  // Handle Locations
  if (target instanceof win.Location) {
    if (parent instanceof win.Document || parent instanceof win.HTMLDocument) {
      return target === parent.location
    }
    return parent.ownerDocument?.location === target
  }

  // Handle descendants the easy way
  if (parent.contains(target)) {
    return true
  }

  const altRoots = findNestedAltRoots(parent, win)
  for (const altRoot of altRoots) {
    if (containsNode(altRoot.child, target, win)) {
      return true
    }
  }

  return false
}

export interface AltRootFound {
  parent: Node
  child: (ShadowRoot | DocumentFragment)
}

/**
 * Find alternative roots for descendent nodes under a shadow DOM's 'shadowRoot'
 * or HTMLTemplate's 'content', because these are not searched in the built-in
 * DOM 'contains()' method.
 */
export function findNestedAltRoots(node: Node, win: typeof window): AltRootFound[] {
  const roots: AltRootFound[] = []
  if (node instanceof win.Element && node.shadowRoot) {
    roots.push({ parent: node, child: node.shadowRoot })
  }
  if (node instanceof win.HTMLTemplateElement && node.content) {
    roots.push({ parent: node, child: node.content })
  }

  const childNodes = node.childNodes
  for (let i = 0; i < childNodes.length; i++) {
    const child = childNodes[i]
    if (!child) {
      continue
    }
    roots.push(...findNestedAltRoots(child, win))
  }

  return roots
}
