import { uniq } from 'lodash'
import type { NestedMethods } from './ignored-node-methods'
import { IGNORED_NODE_METHODS } from './ignored-node-methods'
import { SPYABLE_NODE_CLASSES } from './spyable-node-classes'

export interface DOMNodeSpyConfig<T> {
  nestedMethods?: NestedMethods<T>
  mutableProps: {
    prop: keyof T
    desc: PropertyDescriptor
  }[]
}

export interface MutableDomDescriptorMap extends Map<unknown, unknown> {
  get: <E extends Node>(key: new () => E) => DOMNodeSpyConfig<E> | undefined
  set: <E extends Node>(key: new () => E, value: DOMNodeSpyConfig<E>) => this
  keys: () => IterableIterator<new () => Node>
}

export function MUTABLE_DOM_PROPS(
  win: Window & typeof globalThis,
): MutableDomDescriptorMap {
  // Get Node and its subclasses, e.g. Element, HTMLElement, HTMLButtonElement, etc.
  const domClasses = uniq(
    Object.keys(SPYABLE_NODE_CLASSES)
      .map(name => Reflect.get(win, name))
      .filter(Boolean)
      .filter(val => val?.prototype instanceof win.Node)
      .sort((a, b) => protoLength(a) - protoLength(b)),
  ) as (new () => Node | Location)[]
  domClasses.unshift(win.Location)

  const map: MutableDomDescriptorMap = new Map()

  // Loop through Node and its subclasses to find all the mutable properties.
  for (const cls of domClasses) {
    for (
      let proto: object | null = cls;
      proto;
      proto = Reflect.getPrototypeOf(proto)
    ) {
      if (
        map.has(proto)
        || proto === win.EventTarget
        || proto === win.URL
        || proto === Reflect.getPrototypeOf(win.Location)
      ) {
        break
      }

      if (!map.has(proto)) {
        // @ts-expect-error The proto should be the right type
        map.set(proto, { mutableProps: [] })
      }

      // Get the descriptors, i.e. the properties defined in the class definition.
      const descriptors = Object.getOwnPropertyDescriptors(
        Reflect.get(proto, 'prototype') as Node,
      )

      for (const [prop, desc] of Object.entries(descriptors)) {
        if (Reflect.has(IGNORED_NODE_METHODS, prop)) {
          continue
        }

        if (desc.set || typeof desc.value === 'function') {
          // @ts-expect-error The prop should exist on the object
          map.get(proto)!.mutableProps.push({ prop, desc })
        }
      }
    }
  }

  const htmlElementNestedMethods: NestedMethods<HTMLElement> = {
    style: ['setProperty'],
    classList: ['add', 'remove', 'replace', 'toggle'],
    dataset: [],
    attributes: ['setNamedItem', 'removeNamedItem'],
  }
  map.get(win.HTMLElement)!.nestedMethods = htmlElementNestedMethods

  return map
}

function protoLength(obj: unknown): number {
  let count = 0
  let proto = obj
  while (proto) {
    count++
    proto = Reflect.getPrototypeOf(proto)
  }
  return count
}
