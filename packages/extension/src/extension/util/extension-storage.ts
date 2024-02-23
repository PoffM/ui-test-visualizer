import type { z } from 'zod'
import type * as vscode from 'vscode'
import type { JsonValue } from 'type-fest'

export interface SafeStorage<T> {
  get: <P extends (keyof T & string)>(key: P) => Promise<T[P] | undefined>
  set: <P extends (keyof T & string)>(
    key: P, value: T[P] | ((old: T[P] | undefined) => T[P])
  ) => Promise<T[P]>
}

/** Wraps VSCode's extension 'globalState' with type-safe getters and setters. */
export function extensionStorage<T extends Record<string, JsonValue>>(
  schema: { [P in keyof T]: z.ZodType<T[P]> },

  /** post-process the data after accessing or setting it. */
  postprocess: { [P in keyof T]?: (pre: T[P]) => Promise<T[P]> },

  extensionContext: vscode.ExtensionContext,
): SafeStorage<T> {
  const { globalState } = extensionContext

  return {
    get: async (prop) => {
      if (!(typeof prop === 'string' && prop in schema)) {
        throw new Error(`Property ${prop.toString()} not defined in schema`)
      }

      const validator = schema[prop]
      if (!validator) {
        throw new Error(`No validator for Extension globalState property ${prop.toString()}`)
      }

      const rawVal = globalState.get(prop)

      const parsedVal = validator.safeParse(rawVal)
      if (!parsedVal.success) {
        return undefined
      }

      let val = parsedVal.data

      val = await postprocess[prop]?.(val) ?? val

      return val
    },
    set: async (prop, setter) => {
      if (!(typeof prop === 'string' && prop in schema)) {
        throw new Error(`Property ${prop.toString()} not defined in schema`)
      }

      const validator = schema[prop]
      if (!validator) {
        throw new Error(`No validator for Extension globalState property ${prop}`)
      }

      let newValue = typeof setter === 'function'
        ? setter(globalState.get(prop))
        : setter

      newValue = await postprocess[prop]?.(newValue) ?? newValue

      const parsedVal = validator.safeParse(newValue)
      if (!parsedVal.success) {
        throw new Error(
          `Invalid value for ${prop}: ${newValue} (${parsedVal.error.toString()})`,
        )
      }

      globalState.update(prop, newValue)

      return newValue
    },
  }
}
