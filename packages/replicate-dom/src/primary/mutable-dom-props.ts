import type { Document, IWindow } from 'happy-dom'
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

  // Get Node and its subclasses, e.g. Element, HTMLElement, HTMLButtonElement, etc.
  const domClasses = uniq(
    windowValues.filter(
      // @ts-expect-error Prototype should exist on the object
      val => val?.prototype instanceof win.Node,
    ) as (new () => Node)[],
  ).sort((a, b) => protoLength(a) - protoLength(b))
  domClasses.unshift(win.Node)
  domClasses.unshift(win.Location)

  const map: MutableDomDescriptorMap = new Map()

  // Loop through Node and its subclasses to find all the mutable properties.
  for (const cls of domClasses) {
    for (
      let proto: object | null = cls;
      proto;
      proto = Reflect.getPrototypeOf(proto)
    ) {
      if (
        map.has(proto)
        || proto === win.EventTarget
        || proto === win.URL
      ) {
        break
      }

      if (!map.has(proto)) {
        map.set(proto, { mutableProps: [] })
      }

      // Get the descriptors, i.e. the properties defined in the class definition.
      const descriptors = Object.getOwnPropertyDescriptors(
        Reflect.get(proto, 'prototype') as Node,
      )

      for (const [prop, desc] of Object.entries(descriptors)) {
        if (Reflect.has(IGNORED_DESCRIPTORS, prop)) {
          continue
        }

        if (desc.set || typeof desc.value === 'function') {
          // @ts-expect-error The prop should exist on the object
          map.get(proto)!.mutableProps.push({ prop, desc })
        }
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
  (
    NodeFunctionKeysMap[keyof NodeFunctionKeysMap]
    | FunctionKeys<Node>
    | FunctionKeys<Document>
    | ObjectKeys
  )
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

  createElement: true,
  createAttribute: true,
  createAttributeNS: true,
  createComment: true,
  createDocumentFragment: true,
  createElementNS: true,
  createEvent: true,
  createNodeIterator: true,
  createProcessingInstruction: true,
  createRange: true,
  createSVGAngle: true,
  createSVGLength: true,
  createSVGNumber: true,
  createSVGPoint: true,
  createSVGRect: true,
  createSVGTransform: true,
  createTextNode: true,
  createTreeWalker: true,

  onreadystatechange: true,
  onpointerlockchange: true,
  onpointerlockerror: true,
  onbeforecopy: true,
  onbeforecut: true,
  onbeforepaste: true,
  onfreeze: true,
  onresume: true,
  onsearch: true,
  onvisibilitychange: true,
  onfullscreenchange: true,
  onfullscreenerror: true,
  onwebkitfullscreenchange: true,
  onwebkitfullscreenerror: true,
  onbeforexrselect: true,
  onabort: true,
  onbeforeinput: true,
  onblur: true,
  oncancel: true,
  oncanplay: true,
  oncanplaythrough: true,
  onchange: true,
  onclick: true,
  onclose: true,
  oncontextlost: true,
  oncontextmenu: true,
  oncontextrestored: true,
  oncuechange: true,
  ondblclick: true,
  ondrag: true,
  ondragend: true,
  ondragenter: true,
  ondragleave: true,
  ondragover: true,
  ondragstart: true,
  ondrop: true,
  ondurationchange: true,
  onemptied: true,
  onended: true,
  onerror: true,
  onfocus: true,
  onformdata: true,
  oninput: true,
  oninvalid: true,
  onkeydown: true,
  onkeypress: true,
  onkeyup: true,
  onload: true,
  onloadeddata: true,
  onloadedmetadata: true,
  onloadstart: true,
  onmousedown: true,
  onmouseenter: true,
  onmouseleave: true,
  onmousemove: true,
  onmouseout: true,
  onmouseover: true,
  onmouseup: true,
  onmousewheel: true,
  onpause: true,
  onplay: true,
  onplaying: true,
  onprogress: true,
  onratechange: true,
  onreset: true,
  onresize: true,
  onscroll: true,
  onsecuritypolicyviolation: true,
  onseeked: true,
  onseeking: true,
  onselect: true,
  onslotchange: true,
  onstalled: true,
  onsubmit: true,
  onsuspend: true,
  ontimeupdate: true,
  ontoggle: true,
  onvolumechange: true,
  onwaiting: true,
  onwebkitanimationend: true,
  onwebkitanimationiteration: true,
  onwebkitanimationstart: true,
  onwebkittransitionend: true,
  onwheel: true,
  onauxclick: true,
  ongotpointercapture: true,
  onlostpointercapture: true,
  onpointerdown: true,
  onpointermove: true,
  onpointerrawupdate: true,
  onpointerup: true,
  onpointercancel: true,
  onpointerover: true,
  onpointerout: true,
  onpointerenter: true,
  onpointerleave: true,
  onselectstart: true,
  onselectionchange: true,
  onanimationend: true,
  onanimationiteration: true,
  onanimationstart: true,
  ontransitionrun: true,
  ontransitionstart: true,
  ontransitionend: true,
  ontransitioncancel: true,
  oncopy: true,
  oncut: true,
  onpaste: true,
  onbeforematch: true,
  onafterprint: true,
  onbeforeprint: true,
  onbeforeunload: true,
  onhashchange: true,
  onlanguagechange: true,
  onmessage: true,
  onmessageerror: true,
  onoffline: true,
  ononline: true,
  onpagehide: true,
  onpageshow: true,
  onpopstate: true,
  onrejectionhandled: true,
  onstorage: true,
  onunhandledrejection: true,
  onunload: true,
  onanimationcancel: true,
  oncompositionend: true,
  oncompositionstart: true,
  oncompositionupdate: true,
  onfocusin: true,
  onfocusout: true,
  ongamepadconnected: true,
  ongamepaddisconnected: true,
  ontouchcancel: true,
  ontouchend: true,
  ontouchmove: true,
  ontouchstart: true,

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

  item: true,
  assignedElements: true,
  assignedNodes: true,

}
