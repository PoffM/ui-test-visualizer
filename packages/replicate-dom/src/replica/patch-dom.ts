import { castArray } from 'lodash'
import type { DomNodePath, HTMLPatch, SerializedDomNode } from '../types'
import type { DomClasses } from '../primary/mutable-dom-props'
import { getPropertyDescriptor } from '../property-util'
import { getNodeByPath, parseDomNode } from './parse-mutations'

export function applyDomPatch(root: Node, htmlPatch: HTMLPatch, classes: DomClasses) {
  const doc = root.nodeType === 9 // Check if the root node is Node.DOCUMENT_NODE
    ? root as Document
    : root.ownerDocument

  if (!doc) {
    throw new Error('Root node must be a Document type or have an owner document')
  }

  let targetNode = getNodeByPath(root, htmlPatch.targetNodePath, classes)

  const propPath = castArray(htmlPatch.prop)

  const prop = propPath.at(-1)
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
  const targetFn = Reflect.get(targetNode, prop)
  if (typeof targetFn === 'function') {
    const parsedArgs = htmlPatch.args.map((arg) => {
      if (Array.isArray(arg)) {
        // If the first element is a string (the tag), it's a serialized dom node
        if (typeof arg[0] === 'string') {
          return parseDomNode(arg as SerializedDomNode, doc, classes)
        }
        // If the first element is a number, it's a path to an existing node
        if (typeof arg[0] === 'number') {
          return getNodeByPath(root, arg as DomNodePath, classes)
        }
      }

      // If the property is a path array or the arg is a string or null, the arg is plain text
      if (
        propPath.length > 1
        || arg === null
        || typeof arg === 'string'
        || typeof arg === 'number'
        || typeof arg === 'boolean'
      ) {
        return arg
      }

      if (typeof arg === 'object' && !Array.isArray(arg)) {
        return arg.object
      }

      throw new Error(`Unknown mutation arg type: ${arg}`)
    })

    Reflect.apply(targetFn, targetNode, parsedArgs)
    return
  }

  // Check if the property is a setter
  const propDescriptor = getPropertyDescriptor(targetNode, prop)

  // If it's a defined setter
  if (typeof propDescriptor?.set === 'function') {
    Reflect.set(targetNode, prop, htmlPatch.args[0])
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
