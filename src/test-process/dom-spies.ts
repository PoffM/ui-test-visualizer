import { castArray } from "lodash";
import { spyOn } from "tinyspy";

export type MutationCallback = (
  node: Node,
  prop: string | string[],
  args: (Node | null | string)[]
) => void;

/** Run a callback function when a DOM node is mutated. */
export function spyOnDomNodes(callback: MutationCallback) {
  for (const cfg of NODE_SPY_CONFIGS()) {
    initDomSpies(cfg, callback);
  }
  initCSSStyleDeclarationSpies(callback);
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

/** Listens to the CSSStyleDeclaration's "setProperty" method and setters: Both ways you can change styles. */
function initCSSStyleDeclarationSpies(callback: MutationCallback) {
  // Spy on HTMLElement's "style" getter
  const styleSpy = spyOn(
    HTMLElement.prototype,
    { getter: "style" },
    function () {
      // @ts-expect-error The "this" context corresponds to the first spyOn argument
      const element = this as HTMLElement;
      const styleObj: CSSStyleDeclaration = styleSpy
        .getOriginal()
        .call(element);

      // Wrap the CSSStyleDeclaration in a Proxy so we can listen to property changes:
      return new Proxy(styleObj, {
        // Listen to the CSSStyleDeclaration's "setProperty" method
        get: (_, styleProp: string) => {
          if (styleProp === "setProperty") {
            // @ts-expect-error
            return (...setPropertyArgs) => {
              return reportAndApplyMutations({
                callOriginalFn: () =>
                  Reflect.apply(
                    styleObj.setProperty,
                    styleObj,
                    setPropertyArgs
                  ),
                report: () =>
                  callback(element, ["style", "setProperty"], setPropertyArgs),
              });
            };
          }
          return Reflect.get(styleObj, styleProp);
        },
        // Listen to the CSSStyleDeclaration's setter properties
        set: (_, prop, value) => {
          return reportAndApplyMutations({
            callOriginalFn: () => Reflect.set(styleObj, prop, value),
            report: () => {
              if (typeof prop === "string") {
                callback(element, prop, [value]);
              }
            },
          });
        },
      });
    }
  );
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
