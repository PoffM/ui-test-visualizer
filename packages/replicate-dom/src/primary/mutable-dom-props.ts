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
  DocumentFragment: new () => DocumentFragment
  XMLSerializer: new () => XMLSerializer
  DOMParser: new () => DOMParser
}

/** All methods and setters that mutate the DOM */
export function MUTABLE_DOM_PROPS(classes: DomClasses): DOMNodeSpyConfig<any>[] {
  return [
    {
      cls: classes.Element,
      methods: [
        'normalize',
        'insertBefore',
        'insertAdjacentElement',
        'appendChild',
        'replaceChild',
        'removeChild',
        'setAttribute',
        'setAttributeNS',
        'removeAttribute',
        'scroll',
        'scrollTo',
      ],
      setters: [
        'innerHTML',
        'textContent',
        'nodeValue',
        'className',
        'classList',
      ],
    } satisfies DOMNodeSpyConfig<Element>,
    {
      cls: classes.HTMLElement,
      nestedMethods: {
        style: ['setProperty'],
        classList: ['add', 'remove', 'replace', 'toggle'],
        dataset: [],
        attributes: ['setNamedItem', 'removeNamedItem'],
      },
    } satisfies DOMNodeSpyConfig<HTMLElement>,
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
  ]
}
