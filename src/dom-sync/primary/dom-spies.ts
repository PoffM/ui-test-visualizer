import { castArray } from "lodash";
import { spyOn } from "tinyspy";

export type MutationCallback = (
  node: Node,
  prop: string | string[],
  args: (Node | null | string)[]
) => void;

/** Get all keys where their value matches the given Matcher. */
type KeysWithVal<T, Matcher> = {
  [K in keyof T]: T[K] extends Matcher ? K : never;
}[keyof T] &
  string;

/** Get only the object keys that match the given matcher type.  */
type FilterKeys<T, Matcher, IfMatch, IfNotMatch> = keyof {
  [K in keyof T]: T[K] extends Matcher ? IfMatch : IfNotMatch;
};

/** Configures which methods and properties should be spied on. */
type DOMNodeSpyConfig<T> = {
  cls: new () => T;
  methods: Extract<FilterKeys<T, Function, string, never>, string>[];
  props: Extract<FilterKeys<T, Function, never, string>, string>[];
};

/** Run a callback function when a DOM node is mutated. */
export function spyOnDomNodes(callback: MutationCallback) {
  for (const cfg of NODE_SPY_CONFIGS()) {
    initDomSpies(cfg, callback);
  }
  spyOnNestedProperty(
    HTMLElement.prototype,
    "style",
    ["setProperty"],
    callback
  );
  spyOnNestedProperty(
    HTMLElement.prototype,
    "classList",
    ["add", "remove", "replace", "toggle"],
    callback
  );
  spyOnNestedProperty(HTMLElement.prototype, "dataset", [], callback);
  spyOnNestedProperty(
    HTMLElement.prototype,
    "attributes",
    ["setNamedItem", "removeNamedItem"],
    callback
  );
}

function initDomSpies<T extends Node>(
  { cls, methods, props }: DOMNodeSpyConfig<T>,
  callback: MutationCallback
) {
  for (const method of methods) {
    const methodSpy = spyOn(
      cls.prototype,
      method,
      function (...args: unknown[]) {
        return reportAndApplyMutations({
          // @ts-expect-error
          callOriginalFn: () => methodSpy.getOriginal().call(this, ...args),
          report: () => {
            // @ts-expect-error
            if (window.document.contains(this)) {
              // @ts-expect-error
              callback(this, method, args);
            }
          },
        });
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
        reportAndApplyMutations({
          // @ts-expect-error
          callOriginalFn: () => originalSetter.call(this, value),
          report: () => {
            // @ts-expect-error
            if (window.document.contains(this)) {
              // @ts-expect-error
              callback(this, prop, castArray(value));
            }
          },
        });
      });
    }
  }
}

/**
 * Listens to setters and methods on a nested object.
 * e.g. HTMLElement.style: Listen to "setProperty" and all setter properties.
 */
function spyOnNestedProperty<
  T extends Node,
  G extends KeysWithVal<T, object>,
  S extends KeysWithVal<T[G], (...args: any) => any>
>(cls: T, getter: G, spiedMethods: S[], callback: MutationCallback) {
  // Spy on the getter property.
  // @ts-expect-error
  const spy = spyOn(cls, { getter }, function () {
    // @ts-expect-error The "this" context corresponds to the first spyOn argument
    const root = this as T;
    // @ts-expect-error
    const nestedObj: T[G] & object = spy.getOriginal().call(root);

    // Wrap the CSSStyleDeclaration in a Proxy so we can listen to property changes:
    return new Proxy(nestedObj, {
      // Listen to the specified method on the nested object
      get: (_, accessedProp: string) => {
        if ((spiedMethods as string[]).includes(accessedProp)) {
          // @ts-expect-error
          return (...spiedMethodArgs) => {
            return reportAndApplyMutations({
              callOriginalFn: () =>
                Reflect.apply(
                  // @ts-expect-error
                  nestedObj[accessedProp],
                  nestedObj,
                  spiedMethodArgs
                ),
              report: () =>
                callback(root, [getter, accessedProp], spiedMethodArgs),
            });
          };
        }
        return Reflect.get(nestedObj, accessedProp);
      },
      // Listen to the CSSStyleDeclaration's setter properties
      set: (_, prop, value) => {
        return reportAndApplyMutations({
          callOriginalFn: () => Reflect.set(nestedObj, prop, value),
          report: () => {
            if (typeof prop === "string") {
              callback(root, [getter, prop], [value]);
            }
          },
        });
      },
    });
  });
}

function reportAndApplyMutations<T>({
  report,
  callOriginalFn,
}: {
  report: () => void;
  callOriginalFn: () => T;
}): T {
  if (process.env.EXPERIMENTAL_FAST_MODE === "true") {
    report();
    return callOriginalFn();
  }
  const result = callOriginalFn();
  report();
  return result;
}

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
