/** Get only the object keys that match the given matcher type.  */
type FilterKeys<T, Matcher, IfMatch, IfNotMatch> = keyof {
  [K in keyof T]: T[K] extends Matcher ? IfMatch : IfNotMatch;
}

/** Configures which methods and properties should be spied on. */
export interface DOMNodeSpyConfig<T> {
  cls: new () => T
  methods?: Extract<FilterKeys<T, Function, string, never>, string>[]
  setters?: Extract<FilterKeys<T, Function, never, string>, string>[]
  nestedMethods?: { [P in keyof T]?: (keyof T[P])[] }
}

export interface DomClasses {
  Element: new () => Element
  HTMLElement: new () => HTMLElement
  Text: new () => Text
  Node: new () => Node
  CharacterData: new () => CharacterData
  Comment: new () => Comment
  Document: new () => Document
  HTMLDocument: new () => HTMLDocument
  DocumentFragment: new () => DocumentFragment
  XMLSerializer: new () => XMLSerializer
  Attr: new () => Attr
  ShadowRoot: new () => ShadowRoot
  HTMLTemplateElement: new () => HTMLTemplateElement
  Location: new () => Location
  DocumentType: new () => DocumentType
  HTMLButtonElement: new () => HTMLButtonElement
  HTMLDialogElement: new () => HTMLDialogElement
}

/** All methods and setters that mutate the DOM */
export function MUTABLE_DOM_PROPS(classes: DomClasses): DOMNodeSpyConfig<any>[] {
  const cfgs: DOMNodeSpyConfig<any>[] = [
    {
      cls: classes.Node,
      methods: [
        'normalize',
        'insertBefore',
        'appendChild',
        'replaceChild',
        'removeChild',
      ],
      setters: ['textContent', 'nodeValue'],
    } satisfies DOMNodeSpyConfig<Node>,
    {
      cls: classes.Element,
      methods: [
        'normalize',
        'insertBefore',
        'insertAdjacentElement',
        'insertAdjacentText',
        'append',
        'appendChild',
        'replaceChild',
        'removeChild',
        'setAttribute',
        'setAttributeNS',
        'setAttributeNode',
        'setAttributeNodeNS',
        'removeAttribute',
        'removeAttributeNode',
        'removeAttributeNS',
        'scroll',
        'scrollTo',
        'attachShadow',
        'prepend',
        'replaceChildren',
      ],
      setters: [
        'innerHTML',
        'textContent',
        'nodeValue',
        'className',
        'classList',
        'scrollLeft',
        'scrollTop',
      ],
    } satisfies DOMNodeSpyConfig<Element>,
    {
      cls: classes.HTMLElement,
      methods: [
        'focus',
        'blur',
      ],
      nestedMethods: {
        style: ['setProperty'],
        classList: ['add', 'remove', 'replace', 'toggle'],
        dataset: [],
        attributes: ['setNamedItem', 'removeNamedItem'],
      },
      setters: [
        'innerText',
        'innerHTML',
        'textContent',
        'nodeValue',
        'className',
        'classList',
      ],
    } satisfies DOMNodeSpyConfig<HTMLElement>,
    {
      cls: classes.HTMLButtonElement,
      methods: [
        'setCustomValidity',
      ],
      nestedMethods: {},
      setters: [],
    } satisfies DOMNodeSpyConfig<HTMLButtonElement>,
    {
      cls: classes.HTMLDialogElement,
      methods: [
        'close',
        'show',
        'showModal',
      ],
      nestedMethods: {},
      setters: ['returnValue'],
    } satisfies DOMNodeSpyConfig<HTMLDialogElement>,
    {
      cls: classes.CharacterData,
      methods: [
        'normalize',
        'insertBefore',
        'appendChild',
        'appendData',
        'deleteData',
        'insertData',
        'replaceData',
        'replaceChild',
        'replaceWith',
        'removeChild',
        'remove',
        'before',
        'after',
      ],
      setters: ['textContent', 'nodeValue', 'data'],
    } satisfies DOMNodeSpyConfig<CharacterData>,
    {
      cls: classes.Text,
      methods: [
        'normalize',
        'appendData',
        'insertData',
        'deleteData',
        'replaceData',
      ],
      setters: ['textContent', 'nodeValue'],
    } satisfies DOMNodeSpyConfig<Text>,
    {
      cls: classes.Document,
      methods: [
        'open',
        'write',
        'append',
        'appendChild',
        'insertBefore',
        'prepend',
        'replaceChildren',
        'removeChild',
      ],
      setters: [
        'textContent',
        'title',
        'cookie',
      ],
    } satisfies DOMNodeSpyConfig<Document>,
    {
      cls: classes.HTMLDocument,
      methods: [
        'open',
        'write',
        'append',
        'appendChild',
        'insertBefore',
        'prepend',
        'replaceChildren',
        'removeChild',
      ],
      setters: [
        'textContent',
        'title',
        'cookie',
      ],
    } satisfies DOMNodeSpyConfig<HTMLDocument>,
    {
      cls: classes.DocumentFragment,
      methods: [
        'append',
        'appendChild',
        'insertBefore',
        'prepend',
        'replaceChildren',
        'removeChild',
      ],
      setters: [
        'textContent',
      ],
    } satisfies DOMNodeSpyConfig<DocumentFragment>,
    {
      cls: classes.HTMLTemplateElement,
      methods: [
        'appendChild',
        'removeChild',
        'insertBefore',
        'replaceChild',
      ],
      setters: ['innerHTML'],
    } satisfies DOMNodeSpyConfig<HTMLTemplateElement>,
    {
      cls: classes.ShadowRoot,
      methods: [
        'append',
        'appendChild',
        'insertBefore',
        'prepend',
        'replaceChildren',
        'removeChild',
      ],
      setters: [
        'textContent',
        'innerHTML',
        'adoptedStyleSheets',
      ],
    } satisfies DOMNodeSpyConfig<ShadowRoot>,
    {
      cls: classes.Location,
      methods: [],
      setters: [
        'href',
      ],
    } satisfies DOMNodeSpyConfig<Location>,
  ]

  // Add the classes in the right order (superclass before subclass), so
  // spy functions can be added to the prototypes without conflicting with each other
  for (let i = 0; i < cfgs.length; i++) {
    for (let j = 0; j < i; j++) {
      const after = cfgs[i]!.cls
      const before = cfgs[j]!.cls

      if (before.prototype instanceof after) {
        throw new TypeError(
          `${MUTABLE_DOM_PROPS.name}: Superclasses should be added to the list before subclasses: ${before.name} came before ${after.name}`,
        )
      }
    }
  }

  return cfgs
}
