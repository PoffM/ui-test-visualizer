import { castArray } from 'lodash'
import type { SpyImpl } from 'tinyspy'
import { spyOn } from 'tinyspy'
import type { DOMNodeSpyConfig, DomClasses } from './mutable-dom-props'
import { MUTABLE_DOM_PROPS } from './mutable-dom-props'

export type MutationCallback = (
  node: Node,
  prop: string | string[],
  args: (Node | null | string)[]
) => void

/** Get all keys where their value matches the given Matcher. */
type KeysWithVal<T, Matcher> = {
  [K in keyof T]: T[K] extends Matcher ? K : never;
}[keyof T] &
string

/** Run a callback function when a DOM node is mutated. */
export function spyOnDomNodes(
  classes: DomClasses,
  root: Node,
  callback: MutationCallback,
) {
  for (const cfg of MUTABLE_DOM_PROPS(classes)) {
    initDomSpies(cfg, callback, root)
  }
}

function initDomSpies<T extends Node>(
  { cls, methods, setters, nestedMethods }: DOMNodeSpyConfig<T>,
  callback: MutationCallback,
  root: Node,
) {
  for (const method of methods ?? []) {
    const methodSpy: SpyImpl<unknown[], unknown> = spyOn(
      cls.prototype,
      method,
      function (this: T, ...args: any[]) {
        if (root.contains(this)) {
          callback(this, method, args)
        }
        return methodSpy.getOriginal().call(this, ...args)
      },
    )
  }
  for (const setter of setters ?? []) {
    // Store a reference to the original setter
    const originalSetter = Object.getOwnPropertyDescriptor(
      cls.prototype,
      setter,
    )?.set

    if (originalSetter) {
      spyOn(cls.prototype, { setter }, function (this: T, value) {
        originalSetter.call(this, value)
        if (root.contains(this)) {
          callback(this, setter, castArray(value))
        }
      })
    }
  }
  for (const [key, methods] of Object.entries(nestedMethods ?? {})) {
    spyOnNestedProperty(cls.prototype, key, methods, callback)
  }
}

/**
 * Listens to setters and methods on a nested object.
 * e.g. HTMLElement.style: Listen to "setProperty" and all setter properties.
 */
function spyOnNestedProperty<
  T extends Node,
  G extends KeysWithVal<T, object>,
  S extends KeysWithVal<T[G], (...args: any) => any>,
>(cls: T, getter: G, spiedMethods: S[], callback: MutationCallback) {
  // Spy on the getter property.
  // @ts-expect-error "getter" should be the correct type
  const spy = spyOn(cls, { getter }, function (this: T) {
    // @ts-expect-error asserted types here should be correct
    const nestedObj = spy.getOriginal().call(this) as T[G] & object

    // Wrap the CSSStyleDeclaration in a Proxy so we can listen to property changes:
    return new Proxy(nestedObj, {
      // Listen to the specified method on the nested object
      get: (_, accessedProp: string) => {
        if ((spiedMethods as string[]).includes(accessedProp)) {
          return (...spiedMethodArgs: any[]) => {
            callback(this, [getter, accessedProp], spiedMethodArgs)
            return Reflect.apply(
              // @ts-expect-error "accessedProp" should exist on the nested object
              nestedObj[accessedProp],
              nestedObj,
              spiedMethodArgs,
            )
          }
        }
        return Reflect.get(nestedObj, accessedProp)
      },
      // Listen to the CSSStyleDeclaration's setter properties
      set: (_, setter, value) => {
        // Report the mutation
        if (typeof setter === 'string') {
          callback(this, [getter, setter], [value])
        }
        // Apply the original mutation
        return Reflect.set(nestedObj, setter, value)
      },
    })
  })
}
