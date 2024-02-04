/** Get only the object keys that match the given matcher type.  */
type FilterKeys<T, Matcher, IfMatch, IfNotMatch> = keyof {
  [K in keyof T]: T[K] extends Matcher ? IfMatch : IfNotMatch;
};

/** Configures which methods and properties should be spied on. */
export type DOMNodeSpyConfig<T> = {
  cls: new () => T;
  methods?: Extract<FilterKeys<T, Function, string, never>, string>[];
  props?: Extract<FilterKeys<T, Function, never, string>, string>[];
  nestedProps?: { [P in keyof T]?: (keyof T[P])[] };
};

/** All methods and setters that mutate the DOM */
export function MUTABLE_DOM_PROPS(): DOMNodeSpyConfig<any>[] {
  return [
    {
      cls: Element,
      methods: [
        "normalize",
        "insertBefore",
        "appendChild",
        "replaceChild",
        "removeChild",
        "setAttribute",
      ],
      props: [
        "innerHTML",
        "textContent",
        "nodeValue",
        "className",
        "classList",
      ],
    } satisfies DOMNodeSpyConfig<Element>,
    {
      cls: HTMLElement,
      nestedProps: {
        style: ["setProperty"],
        classList: ["add", "remove", "replace", "toggle"],
        dataset: [],
        attributes: ["setNamedItem", "removeNamedItem"],
      },
    } satisfies DOMNodeSpyConfig<HTMLElement>,
    {
      cls: Text,
      methods: [
        "normalize",
        "appendData",
        "insertData",
        "deleteData",
        "replaceData",
      ],
      props: ["textContent", "nodeValue"],
    } satisfies DOMNodeSpyConfig<Text>,
    {
      cls: Node,
      methods: [
        "normalize",
        "insertBefore",
        "appendChild",
        "replaceChild",
        "removeChild",
      ],
      props: ["textContent", "nodeValue"],
    } satisfies DOMNodeSpyConfig<Node>,
    {
      cls: CharacterData,
      methods: [
        "normalize",
        "insertBefore",
        "appendChild",
        "appendData",
        "deleteData",
        "insertData",
        "replaceData",
        "replaceChild",
        "replaceWith",
        "removeChild",
        "remove",
        "before",
        "after",
      ],
      props: ["textContent", "nodeValue", "data"],
    } satisfies DOMNodeSpyConfig<CharacterData>,
  ];
}
