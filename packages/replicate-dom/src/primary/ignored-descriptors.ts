import type { IWindow } from 'happy-dom'
import { GlobalWindow } from 'happy-dom'

type FunctionKeys<T> = {
  [P in keyof T]: T[P] extends Function ? P : never
}[keyof T]

/**
 * Map of Node names to their types.
 *
 * e.g.
 * ```
 * {
 *   Node: Node,
 *   Element: Element,
 *   HTMLElement: HTMLElement,
 *   HTMLButtonElement: HTMLButtonElement,
 *   ...etc...
 * }
 * ```
 */
type NodeFunctionKeysMap = {
  [
  P in keyof IWindow as IWindow[P] extends IWindow['Node']
    ? any extends IWindow[P]
      ? never
      : P
    : never
  ]: FunctionKeys<IWindow[P]['prototype']>
}

type ObjectKeys =
  | 'constructor'
  | 'toString'
  | 'toLocaleString'
  | 'valueOf'
  | 'hasOwnProperty'
  | 'isPrototypeOf'
  | 'propertyIsEnumerable'

type NodeFunctionKeys =
  (NodeFunctionKeysMap[keyof NodeFunctionKeysMap] | FunctionKeys<Node> | ObjectKeys)
  & string

const ignoredDescriptors: { [key in NodeFunctionKeys]?: true } = {
  constructor: true,
  toString: true,
  toLocaleString: true,
  valueOf: true,
  hasOwnProperty: true,
  isPrototypeOf: true,
  propertyIsEnumerable: true,

  getAttribute: true,
  getRootNode: true,
  getAttributeNS: true,
  getAttributeNames: true,
  getAttributeNode: true,
  getAttributeNodeNS: true,
  getBoundingClientRect: true,
  getClientRects: true,
  getElementsByClassName: true,
  getElementsByTagName: true,
  getElementsByTagNameNS: true,

  querySelector: true,
  querySelectorAll: true,

  addEventListener: true,
  removeEventListener: true,
  checkIntersection: true,
  checkValidity: true,

  getInnerHTML: true,
  cloneNode: true,

  hasAttribute: true,
  hasAttributeNS: true,
  hasAttributes: true,
  closest: true,
  dispatchEvent: true,

  compareDocumentPosition: true,
  contains: true,
  hasChildNodes: true,
  isDefaultNamespace: true,
  isEqualNode: true,
  isSameNode: true,
  lookupNamespaceURI: true,
  lookupPrefix: true,
}

function* mutableDomDescriptors(win: IWindow) {
  const globalVals = Object.values(win)
  const domClasses = globalVals.filter(
    (val): val is Node => val?.prototype instanceof win.Node,
  )

  for (const val of Object.values(win)) {
    const proto = val?.prototype
    if (proto instanceof win.Node) {
      // console.log(val)
      const descriptors = Object.getOwnPropertyDescriptors(proto)

      for (const [prop, desc] of Object.entries(descriptors)) {
        if (Reflect.has(ignoredDescriptors, prop)) {
          continue
        }

        if (desc.set) {
          yield [proto, prop, desc]
        }

        if (typeof desc.value === 'function') {
          yield [proto, prop, desc]
        }
      }
    }
  }
}

const descs = [...mutableDomDescriptors(new GlobalWindow())]

console.log(descs)
