import type { Document, Window } from 'happy-dom'

type FunctionKeys<T> = {
  [P in keyof T]: T[P] extends Function ? P : never;
}[keyof T]

/**
 * Map of Node names to their function keys.
 */
type NodeFunctionKeysMap = {
  [
  P in keyof Window as Window[P] extends Window['Node']
    ? any extends Window[P] ? never : P
    : never
  ]: FunctionKeys<Window[P] extends { prototype: any } ? Window[P]['prototype'] : never>;
}

type ObjectKeys = 'constructor' |
  'toString' |
  'toLocaleString' |
  'valueOf' |
  'hasOwnProperty' |
  'isPrototypeOf' |
  'propertyIsEnumerable'

type NodeFunctionKeys =
  (
    NodeFunctionKeysMap[keyof NodeFunctionKeysMap] |
    FunctionKeys<Node> |
    FunctionKeys<Document> |
    ObjectKeys) &
    string

/**
 * Methods on Node and its subclasses that don't mutate the DOM;
 * Don't replicate calls to these.
 */
export const IGNORED_NODE_METHODS: {
  [key in NodeFunctionKeys]?: true;
} = {
  constructor: true,
  toString: true,
  toLocaleString: true,
  valueOf: true,
  hasOwnProperty: true,
  isPrototypeOf: true,
  propertyIsEnumerable: true,

  // Form-related methods
  // @ts-expect-error TODO figure out why NodeFunctionKeys doesn't recognize this key
  requestSubmit: true,
  submit: true,

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
