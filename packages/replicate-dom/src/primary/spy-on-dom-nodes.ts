import { castArray } from 'lodash'
import type { SpyImpl } from 'tinyspy'
import { spyOn } from 'tinyspy'
import type { DomClasses } from './mutable-dom-props'
import { MUTABLE_DOM_PROPS } from './mutable-dom-props'

export type MutationCallback = (
  node: Node,
  prop: string | string[],
  args: (Node | null | string)[],
  spyDepth: number
) => void

/** Run a callback function when a DOM node is mutated. */
export function spyOnDomNodes(
  classes: DomClasses,
  root: Node,
  callback: MutationCallback,
) {
  // Don't recursively call the callback
  let spyDepth = 0
  function trackSpy<A extends any[], R>(fn: (...args: A) => R) {
    return function wrappedSpyFn(this: unknown, ...args: A) {
      spyDepth++
      const result: R = fn.apply(this, args)
      spyDepth--
      return result
    }
  }

  // Only call it for nodes within the root,
  // in case both primary and replica DOMs are in the same process.
  const originalCallback = callback
  callback = (node, ...args) => {
    if (root.contains(node)) {
      return originalCallback(node, ...args)
    }
  }

  for (const { cls, methods, setters, nestedMethods } of MUTABLE_DOM_PROPS(classes)) {
    for (const method of methods ?? []) {
      const methodSpy: SpyImpl<unknown[], unknown> = spyOn(
        cls.prototype,
        method,
        trackSpy(function interceptMethod(this: any, ...args: any[]) {
          callback(this, method, args, spyDepth)
          return methodSpy.getOriginal().call(this, ...args)
        }),
      )
    }

    for (const setter of setters ?? []) {
    // Store a reference to the original setter
      const originalSetter = Object.getOwnPropertyDescriptor(
        cls.prototype,
        setter,
      )?.set

      if (originalSetter) {
        spyOn(
          cls.prototype,
          { setter },
          trackSpy(function (this: any, value) {
            originalSetter.call(this, value)
            callback(this, setter, castArray(value), spyDepth)
          }),
        )
      }
    }

    for (const [getter, spiedMethods] of Object.entries(nestedMethods ?? {})) {
    // Spy on the getter property.
      const spy = spyOn(cls.prototype, { getter }, trackSpy(function (this: any) {
      // @ts-expect-error asserted types here should be correct
        const nestedObj = spy.getOriginal().call(this) as T[G] & object

        // Wrap the nested object in a Proxy so we can listen to property changes:
        return new Proxy(nestedObj, {
        // Listen to the specified method on the nested object
          get: (_, accessedProp: string) => {
            if ((spiedMethods as string[]).includes(accessedProp)) {
              return (...spiedMethodArgs: any[]) => {
                callback(this, [getter, accessedProp], spiedMethodArgs, spyDepth)
                return Reflect.apply(
                  nestedObj[accessedProp],
                  nestedObj,
                  spiedMethodArgs,
                )
              }
            }
            return Reflect.get(nestedObj, accessedProp)
          },
          // Listen to the nested object's setter properties
          set: (_, setter, value) => {
          // Report the mutation
            if (typeof setter === 'string') {
              callback(this, [getter, setter], [value], spyDepth)
            }
            // Apply the original mutation
            return Reflect.set(nestedObj, setter, value)
          },
          deleteProperty: (_, prop) => {
          // Report the mutation
            if (typeof prop === 'string') {
              callback(this, [getter, prop], [], spyDepth)
            }
            return Reflect.deleteProperty(nestedObj, prop)
          },
        })
      }))
    }
  }
}
