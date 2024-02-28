import castArray from 'lodash/castArray'
import type { SpyImpl } from 'tinyspy'
import { spyOn } from 'tinyspy'
import { getPropertyDescriptor, getPropertyDescriptorAndProto } from '../property-util'
import type { SerializedDomElement, SpyableClass } from '../types'
import { MUTABLE_DOM_PROPS } from './mutable-dom-props'
import { containsNode } from './contains-node-util'
import { serializeDomNode } from './serialize'

export type MutationCallback = (
  node: SpyableClass,
  prop: string | string[],
  args: (Node | null | string | SerializedDomElement)[],
  spyDepth: number
) => void

/** Run a callback function when a DOM node is mutated. */
export function spyOnDomNodes(
  win: typeof window,
  root: Node,
  callback: MutationCallback,
): void {
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

  const postSpyQueue: (() => void)[] = []
  /** Methods that need to be called after the current spy function. e.g. Web Component connectedCallbacks */
  function flushPostSpyQueue() {
    if (spyDepth === 1) {
      while (postSpyQueue.length) {
        postSpyQueue.shift()?.()
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

  {
    const origDefine = win.customElements.define
    Object.defineProperty(win.customElements, 'define', {
      get() {
        return function overrideDefine(
          this: CustomElementRegistry,
          name: string,
          CustomElementClass: CustomElementConstructor,
          options?: ElementDefinitionOptions,
        ) {
          const lifecycleMethods = [
            'connectedCallback',
            'disconnectedCallback',
            'adoptedCallback',
            'attributeChangedCallback',
          ]

          for (const method of lifecycleMethods) {
            const info = getPropertyDescriptorAndProto(CustomElementClass.prototype, method)
            if (!info) {
              continue
            }

            const { proto } = info

            const lifecycleSpy: SpyImpl = spyOn(
              proto,
              // @ts-expect-error method should exist on proto
              method,
              function (this: Node, ...args: any[]) {
                if (method === 'connectedCallback') {
                  postSpyQueue.push(() => {
                    if (!this.parentNode) {
                      return
                      // throw new Error('Could not find parent node for connectedCallback')
                    }

                    return callback(
                      this.parentNode,
                      'replaceChild',
                      [serializeDomNode(this, win) as SerializedDomElement, this],
                      0,
                    )
                  })
                  const result = lifecycleSpy.getOriginal().call(this, ...args)
                  return result
                }
                else {
                  // Reset to 0 because these callbacks are called inside methods like innerHTML and appendChild
                  const originalSpyDepth = spyDepth
                  spyDepth = 0
                  try {
                    const result = lifecycleSpy.getOriginal().call(this, ...args)
                    return result
                  }
                  finally {
                    spyDepth = originalSpyDepth
                  }
                }
              },
            )
          }

          origDefine.call(this, name, CustomElementClass, options)
        }
      },
      set() {
        throw new Error('Cannot redefine customElements.define')
      },
    })
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
            const result = methodSpy.getOriginal().call(this, ...args)
            flushPostSpyQueue()
            return result
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
              flushPostSpyQueue()
            }),
          )
        }
      }
    }

    // Spy on mutations on nested objects:
    // e.g. "style", "classList", "dataset", "attributes"
    for (const [getter, spiedMethods] of Object.entries(nestedMethods ?? {})) {
      // Spy on the getter property.
      const spy = spyOn(cls.prototype, { getter }, function interceptGetter(this: SpyableClass) {
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
              return trackSpyDepth((...spiedMethodArgs: any[]) => {
                callback(this, [getter, accessedProp], spiedMethodArgs, spyDepth)
                return Reflect.apply(
                  nestedObj[accessedProp],
                  nestedObj,
                  spiedMethodArgs,
                )
              })
            }
            return Reflect.get(nestedObj, accessedProp)
          },
          // Listen to the nested object's setter properties
          set: trackSpyDepth((_, setter, value) => {
            // Report the mutation
            if (typeof setter === 'string') {
              callback(this, [getter, setter], [value], spyDepth)
            }
            // Apply the original mutation
            return Reflect.set(nestedObj, setter, value)
          }),
          deleteProperty: trackSpyDepth((_, prop) => {
            // Report the mutation
            if (typeof prop === 'string') {
              callback(this, [getter, prop], [], spyDepth)
            }
            return Reflect.deleteProperty(nestedObj, prop)
          }),
        })
      })
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
