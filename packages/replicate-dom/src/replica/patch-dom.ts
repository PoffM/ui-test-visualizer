import { castArray } from 'lodash'
import type { DomNodePath, HTMLPatch, SerializedDomNode } from '../types'
import { getNodeByPath, parseDomNode } from './parse-mutations'

export function applyDomPatch(root: Node, htmlPatch: HTMLPatch) {
  const doc = root.nodeType === 9 // Check if the root node is Node.DOCUMENT_NODE
    ? root as Document
    : root.ownerDocument

  if (!doc) {
    throw new Error('Root node must be a Document type or have an owner document')
  }

  let targetNode = getNodeByPath(root, htmlPatch.targetNodePath)
  if (!targetNode) {
    throw new Error(`Node not found: ${String(htmlPatch.targetNodePath)}`)
  }

  const propPath = castArray(htmlPatch.prop)

  const prop = propPath.at(-1) as (keyof typeof targetNode) | undefined
  if (!prop) {
    throw new Error(`No property found in path: ${propPath}`)
  }

  const pathBeforeProp = propPath.slice(0, -1)
  for (const key of pathBeforeProp) {
    // @ts-expect-error The key should exist on this node because the key comes from the same node in the primary DOM.
    targetNode = targetNode?.[key]
  }
  if (!targetNode) {
    throw new Error(
      `Node not found: ${String(htmlPatch.targetNodePath)}.${pathBeforeProp.join('.')}`,
    )
  }

  // Check if the property is a function
  const targetFn = targetNode?.[prop]
  if (typeof targetFn === 'function') {
    const parsedArgs = htmlPatch.args.map((arg) => {
      if (Array.isArray(arg)) {
        // If the first element is a string (the tag), it's a serialized dom node
        if (typeof arg[0] === 'string') {
          return parseDomNode(arg as SerializedDomNode, doc)
        }
        // If the first element is a number, it's a path to an existing node
        if (typeof arg[0] === 'number') {
          return getNodeByPath(root, arg as DomNodePath)
        }
      }

      // If the property is a path array or the arg is a string or null, the arg is plain text
      if (propPath.length > 1 || arg === null || typeof arg === 'string') {
        return arg
      }

      throw new Error(`Unknown mutation arg type: ${arg}`)
    })

    // @ts-expect-error The key should exist on this node because the key comes from the same node in the primary DOM.
    targetNode[prop](...parsedArgs)
    return
  }

  // Check if the property is a setter
  const propDescriptor = (() => {
    for (
      let proto = Object.getPrototypeOf(targetNode);
      proto !== null;
      proto = Object.getPrototypeOf(proto)
    ) {
      const descriptor = Object.getOwnPropertyDescriptor(proto, prop)
      if (descriptor) {
        return descriptor
      }
    }
  })()

  // If it's a defined setter
  if (typeof propDescriptor?.set === 'function') {
    propDescriptor.set.call(targetNode, htmlPatch.args[0])
  }
  // If it's a regular property
  else {
    if (!htmlPatch.args.length) {
      Reflect.deleteProperty(targetNode, prop)
    }
    else {
      Reflect.set(targetNode, prop, htmlPatch.args[0])
    }
  }
}
