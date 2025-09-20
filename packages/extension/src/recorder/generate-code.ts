import type { z } from 'zod/mini'
import type * as vscode from 'vscode'
import { mapValues } from 'lodash'
import type { zRecordedEventData } from '../panel-controller/panel-router'
import type { DebugPauseLocation } from '../util/debugger-tracker'
import type { TestingLibrary } from '../framework-support/detect-test-library'
import type { SupportedFramework } from '../framework-support/detect-test-framework'
import type { SerializedRegexp } from './recorder-codegen-session'

export async function generateCode(
  editor: vscode.TextEditor,
  hasUserEventLib: boolean,
  pausedLocation: DebugPauseLocation,
  testLibrary: TestingLibrary,
  testFramework: SupportedFramework,

  event: string,
  eventData: z.infer<typeof zRecordedEventData>,
  findMethod: string,
  queryArg0: string | SerializedRegexp,
  queryOptions: Record<string, string | boolean | SerializedRegexp> | undefined,

  useExpect: boolean,
  useUserEvent: boolean,
) {
  const parsedQueryOptions = queryOptions && Object.entries(queryOptions).reduce(
    (result, entry) => {
      const [key, val] = entry
      result[key] = (() => {
        if (typeof val === 'string') {
          return `'${val.replace(/'/g, '\\\'')}'`
        }
        else if (typeof val === 'boolean') {
          return val
        }
        else if (val.type === 'regexp') {
          return val.value
        }
        else {
          return ''
        }
      })()

      return result
    },
    {} as Record<string, RegExp | boolean | string>,
  )

  const queryArgsStr = (() => {
    let result = typeof queryArg0 === 'string' ? `'${queryArg0}'` : queryArg0.value
    if (!parsedQueryOptions) {
      return result
    }
    const entries = Object.entries(parsedQueryOptions).map(([key, val]) => {
      return `${key}: ${String(val)}`
    })
    let optionsStr = entries.join(', ')
    if (entries.length > 0) {
      optionsStr = `{ ${optionsStr} }`
      result += `, ${optionsStr}`
    }
    return result
  })()

  const screen = 'screen'

  /**
   * e.g. `screen.getByRole('button', { name: 'Submit' })`
   * or just `document`
   */
  const selector = (() => {
    if (queryArg0 === 'document') {
      return 'document'
    }
    return `${screen}.${findMethod}(${queryArgsStr})`
  })()

  let code = ''
  const requiredImports: Record<string, string> = {
    [screen]: testLibrary,
  }

  // When 'useExpect' is true, generate an 'expect' statement
  if (useExpect) {
    const expect = 'expect'
    code = `${expect}(${selector}).toBeTruthy()`
    if (testFramework === 'vitest') {
      requiredImports[expect] = testFramework
    }
  }
  // Otherwise, generate a userEvent call
  else {
    if (useUserEvent) {
      if (!hasUserEventLib) {
        throw new Error('Cannot use userEvent without @testing-library/user-event installed')
      }
      const userEvent = 'userEvent'

      const userEventArgs = (() => {
        // When using userEvent with text inputs, the method is either 'type' or 'clear'
        if (event === 'change' && typeof eventData.text === 'string') {
          // If the text is empty, use 'clear' instead of 'type'
          if (eventData.text.length === 0) {
            event = 'clear'
            return ''
          }

          // Otherwise 'type' the text
          event = 'type'
          const value = eventData.text.replace(/'/g, '\\\'')
          return `, '${value}'`
        }
        if (event === 'selectOptions' && eventData.options) {
          return `, [${eventData.options.map(it => `'${it.replace(/'/g, '\\\'')}'`).join(', ')}]`
        }
        return ''
      })()

      code = `await ${userEvent}.${event}(${selector}${userEventArgs})`

      requiredImports[userEvent] = '@testing-library/user-event'
    }
    else {
      const fireEvent = 'fireEvent'

      const fireEventArgs = (() => {
        if (event === 'change' && eventData.text) {
          const value = eventData.text.replace(/'/g, '\\\'')
          return `, { target: { value: '${value}' } }`
        }
        if (event === 'selectOptions' && eventData.options) {
          return `, { target: { value: '${eventData.options[0]}' } }`
        }
        return ''
      })()

      code = `${fireEvent}.${event}(${selector}${fireEventArgs})`

      requiredImports[fireEvent] = testLibrary
    }
  }

  const line = editor.document.lineAt(pausedLocation.lineNumber - 1)
  const indent = line.text.match(/^\s*/)?.[0] || ''
  code = `${indent}${code}`

  const importCode = Object.entries(requiredImports).map(([importName, from]) => {
    if (from === 'vitest') {
      from = 'vitest/dist/index.js'
    }
    return `const { ${importName} } = require('${from}');`
  }).join('\n')

  // Replicate the input event from the webview to the test runtime.
  // We do this through a debug expression, which is the same as running code through vscode's 'Debug Terminal'.
  const debugExpression = `
(() => {
${importCode}
${code.replace(/\s*await/, '') /* No 'awaits' allowed in debug expressions */};
})()
`

  return {
    code,
    debugExpression,
    requiredImports,
  }
}
