import type { IWindow } from 'happy-dom'
import { uniq } from 'lodash'

export interface DOMNodeSpyConfig<T> {
  nestedMethods?: NestedMethods<T>
  mutableProps: {
    prop: keyof T
    desc: PropertyDescriptor
  }[]
}

export interface MutableDomDescriptorMap extends Map<unknown, unknown> {
  get: <E extends Node>(key: new () => E) => DOMNodeSpyConfig<E> | undefined
  set: <E extends Node>(key: new () => E, value: DOMNodeSpyConfig<E>) => this
  keys: () => IterableIterator<new () => Node>
}

export function MUTABLE_DOM_PROPS(
  win: Window & typeof globalThis,
): MutableDomDescriptorMap {
  const windowValues = Object.values(win) as unknown[]
  const domClasses = uniq(
    windowValues.filter(
      val => val === win.Node
      // @ts-expect-error Prototype should exist on the object
      || val?.prototype instanceof win.Node,
    ) as (new () => Node)[],
  ).sort((a, b) => protoLength(a) - protoLength(b))

  const map: MutableDomDescriptorMap = new Map()

  for (const cls of domClasses) {
    map.set(cls, { mutableProps: [] })
    const descriptors = Object.getOwnPropertyDescriptors(
      Reflect.get(cls, 'prototype') as Node,
    )

    for (const [prop, desc] of Object.entries(descriptors)) {
      if (Reflect.has(IGNORED_DESCRIPTORS, prop)) {
        continue
      }

      if (desc.set || typeof desc.value === 'function') {
        // @ts-expect-error The prop should exist on the object
        map.get(cls)!.mutableProps.push({ prop, desc })
      }
    }
  }

  const htmlElementNestedMethods: NestedMethods<HTMLElement> = {
    style: ['setProperty'],
    classList: ['add', 'remove', 'replace', 'toggle'],
    dataset: [],
    attributes: ['setNamedItem', 'removeNamedItem'],
  }
  map.get(win.HTMLElement)!.nestedMethods = htmlElementNestedMethods

  return map
}

function protoLength(obj: unknown): number {
  let count = 0
  let proto = obj
  while (proto) {
    count++
    proto = Reflect.getPrototypeOf(proto)
  }
  return count
}

type NestedMethods<T> = {
  [P in keyof T]?: (keyof T[P])[]
}

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

/**
 * Methods on Node and its subclasses that don't mutate the DOM;
 * Don't replicate calls to these.
 */
const IGNORED_DESCRIPTORS: { [key in NodeFunctionKeys]?: true } = {
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
  getBBox: true,
  getInnerHTML: true,
  getCTM: true,
  getCurrentTime: true,
  getElementById: true,
  getEnclosureList: true,
  getIntersectionList: true,
  getScreenCTM: true,

  querySelector: true,
  querySelectorAll: true,

  addEventListener: true,
  removeEventListener: true,
  checkIntersection: true,
  checkValidity: true,

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

  click: true,
  canPlayType: true,
  matches: true,
  reportValidity: true,
  captureStream: true,
  checkEnclosure: true,

  createSVGNumber: true,
  createSVGLength: true,
  createSVGAngle: true,
  createSVGPoint: true,
  createSVGRect: true,
  createSVGTransform: true,
  item: true,
}
