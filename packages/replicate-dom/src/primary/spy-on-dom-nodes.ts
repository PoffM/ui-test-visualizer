import { castArray } from "lodash";
import { spyOn } from "tinyspy";
import { DOMNodeSpyConfig, MUTABLE_DOM_PROPS } from "./mutable-dom-props";

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

/** Run a callback function when a DOM node is mutated. */
export function spyOnDomNodes(callback: MutationCallback) {
  for (const cfg of MUTABLE_DOM_PROPS()) {
    initDomSpies(cfg, callback);
  }
}

function initDomSpies<T extends Node>(
  { cls, methods, props, nestedProps }: DOMNodeSpyConfig<T>,
  callback: MutationCallback
) {
  for (const method of methods ?? []) {
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
  for (const prop of props ?? []) {
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
  for (const [key, props] of Object.entries(nestedProps ?? {})) {
    spyOnNestedProperty(cls.prototype, key, props, callback);
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
