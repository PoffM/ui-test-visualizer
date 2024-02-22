import type { z } from 'zod'
import type * as vscode from 'vscode'

/** Wraps VSCode's extension 'globalState' with type-safe getters and setters. */
export function extensionStorage<T extends Record<string, unknown>>(
  schema: { [P in keyof T]: z.ZodType<T[P]> },
  extensionContext: vscode.ExtensionContext,
): Partial<T> {
  const { globalState } = extensionContext

  return new Proxy({}, {
    get: (target, prop) => {
      if (!(typeof prop === 'string' && prop in schema)) {
        throw new Error(`Property ${prop.toString()} not defined in schema`)
      }

      const validator = schema[prop]
      if (!validator) {
        throw new Error(`No validator for Extension globalState property ${prop.toString()}`)
      }

      const rawVal = globalState.get(prop)

      const parsedVal = validator.safeParse(rawVal)
      if (parsedVal.success) {
        return parsedVal.data
      }

      return undefined
    },
    set: (target, prop, newValue) => {
      if (!(typeof prop === 'string' && prop in schema)) {
        throw new Error(`Property ${prop.toString()} not defined in schema`)
      }

      const validator = schema[prop]
      if (!validator) {
        throw new Error(`No validator for Extension globalState property ${prop}`)
      }

      const parsedVal = validator.safeParse(newValue)
      if (!parsedVal.success) {
        throw new Error(
          `Invalid value for ${prop}: ${newValue} (${parsedVal.error.toString()})`,
        )
      }

      globalState.update(prop, newValue)

      return true
    },
  })
}
