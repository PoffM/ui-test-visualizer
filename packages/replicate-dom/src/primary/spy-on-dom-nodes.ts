import { castArray } from 'lodash'
import type { SpyImpl } from 'tinyspy'
import { spyOn } from 'tinyspy'
import { getPropertyDescriptor } from '../property-util'
import { MUTABLE_DOM_PROPS } from './mutable-dom-props'
import { containsNode } from './contains-node-util'

export type MutationCallback = (
  node: Node,
  prop: string | string[],
  args: (Node | null | string)[],
  spyDepth: number
) => void

/** Run a callback function when a DOM node is mutated. */
export function spyOnDomNodes(
  win: typeof window,
  root: Node,
  callback: MutationCallback,
) {
  // Don't recursively call the callback
  let spyDepth = 0
  function trackSpyDepth<A extends any[], R>(fn: (...args: A) => R) {
    return function wrappedSpyFn(this: unknown, ...args: A) {
      try {
        spyDepth++
        const result: R = fn.apply(this, args)
        return result
      }
      finally {
        spyDepth--
      }
    }
  }

  // Only call the callback for nodes within the root,
  // to make sure different DOM trees in the same JS process are unaffected by each other.
  {
    const originalCallback = callback
    callback = (node, ...args) => {
      if (containsNode(root, node, win)) {
        return originalCallback(node, ...args)
      }
    }
  }

  // Handle "connectedCallback()" calls used in custom elements / web components
  // TODO make this work in jsdom
  {
    const connectedCallbackSymbol = Reflect.ownKeys(win.Node.prototype)
      .find(key => key.toString() === 'Symbol(connectToNode)')

    if (connectedCallbackSymbol) {
      const connectedCallbackSpy = spyOn(
        win.Node.prototype,
        // @ts-expect-error symbols should work here
        connectedCallbackSymbol,
        function (this: Node, ...args) {
          const originalSpyDepth = spyDepth
          spyDepth = 0
          const result = connectedCallbackSpy.getOriginal().call(this, ...args)
          spyDepth = originalSpyDepth
          return result
        },
      )
    }
  }

  const mutableDomProps = MUTABLE_DOM_PROPS(win)
  for (const cls of mutableDomProps.keys()) {
    const { mutableProps, nestedMethods } = mutableDomProps.get(cls)!

    for (const { prop, desc } of mutableProps) {
      if (typeof desc.value === 'function') {
        // Some methods are not available in some environments,
        // e.g. jsdom doesn't implement 'scroll'.
        if (!Reflect.has(cls.prototype, prop)) {
          continue
        }

        const methodSpy: SpyImpl<unknown[], unknown> = spyOn(
          cls.prototype,
          prop,
          trackSpyDepth(function interceptMethod(this: any, ...args: any[]) {
            callback(this, prop, args, spyDepth)
            return methodSpy.getOriginal().call(this, ...args)
          }),
        )
      }
      if (desc.set) {
        // Store a reference to the original setter
        const descriptor = getPropertyDescriptor(cls.prototype, prop)

        if (descriptor) {
          const setFn = descriptor.set
          if (!setFn) {
            continue
          }
          spyOn(
            cls.prototype,
            { setter: prop },
            trackSpyDepth(function interceptSetter(this: any, value) {
              callback(this, prop, castArray(value), spyDepth)
              setFn.call(this, value)
            }),
          )
        }
      }
    }

    // Spy on mutations on nested objects:
    // e.g. "style", "classList", "dataset", "attributes"
    for (const [getter, spiedMethods] of Object.entries(nestedMethods ?? {})) {
      // Spy on the getter property.
      const spy = spyOn(cls.prototype, { getter }, trackSpyDepth(function interceptGetter(this: any) {
        // @ts-expect-error asserted types here should be correct
        const nestedObj = spy.getOriginal().call(this) as T[G] & object

        if (!nestedObj) {
          return nestedObj
        }

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

  // Spy on shadow DOMs and always make them open,
  // so they can more easily be read and replicated
  const attachShadowSpy: SpyImpl<[init: ShadowRootInit], ShadowRoot> = spyOn(
    win.Element.prototype,
    'attachShadow',
    function (this: Element, init: ShadowRootInit) {
      return attachShadowSpy.getOriginal().call(
        this,
        { ...init, mode: 'open' },
      )
    },
  )
}
