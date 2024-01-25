import { spyOn } from "tinyspy";

/** Run a callback function when a DOM node is mutated. */
export function spyOnDomNodes(callback: () => void) {
  for (const cfg of NODE_SPY_CONFIGS()) {
    initDomSpies(cfg, callback);
  }
}

function initDomSpies<T extends Node>(
  { cls, methods, props }: DOMNodeSpyConfig<T>,
  callback: () => void
) {
  for (const method of methods) {
    const methodSpy = spyOn(
      cls.prototype,
      method,
      function (...args: unknown[]) {
        // @ts-expect-error "this" should work, it refers to the DOM node
        const result = methodSpy.getOriginal().call(this, ...args);
        callback();
        return result;
      }
    );
  }
  for (const prop of props) {
    // Store a reference to the original setter
    const originalSetter = Object.getOwnPropertyDescriptor(
      cls.prototype,
      prop
    )?.set;

    if (originalSetter) {
      spyOn(cls.prototype, { setter: prop }, function (value) {
        // @ts-expect-error "this" should work, it refers to the DOM node
        originalSetter.call(this, value);
        callback();
      });
    }
  }
}

/** Get only the object keys that match the given matcher type.  */
type FilterKeys<T, Matcher, IfMatch, IfNotMatch> = keyof {
  [K in keyof T]: T[K] extends Matcher ? IfMatch : IfNotMatch;
};

/** Configures which methods and properties should be spied on. */
type DOMNodeSpyConfig<T extends Node> = {
  cls: new () => T;
  methods: Extract<FilterKeys<T, Function, string, never>, string>[];
  props: Extract<FilterKeys<T, Function, never, string>, string>[];
};

// All methods and setters that modify the DOM
function NODE_SPY_CONFIGS(): DOMNodeSpyConfig<any>[] {
  return [
    {
      cls: Element,
      methods: [
        "normalize",
        "insertBefore",
        "appendChild",
        "replaceChild",
        "removeChild",
      ],
      props: ["innerHTML", "textContent", "nodeValue"],
    } satisfies DOMNodeSpyConfig<Element>,
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
