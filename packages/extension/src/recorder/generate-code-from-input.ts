import type { SupportedFramework } from '../framework-support/detect-test-framework'
import type { TestingLibrary } from '../framework-support/detect-test-library'
import type { RecordInputAsCodeParams } from './recorder-codegen-session'

export interface RecorderGeneratedCode {
  code: string[]
  debugExpression: string
  requiredImports: Record<string, string>
}

export function generateCodeFromInput(
  hasUserEventLib: boolean,
  testLibrary: TestingLibrary,
  testFramework: SupportedFramework,
  userEventLibPath: string,
  {
    event,
    eventData,
    findMethod,
    queryArg0,
    queryOptions,
    useExpect,
    useFireEvent,
  }: RecordInputAsCodeParams,
): RecorderGeneratedCode {
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
  const fireEvent = 'fireEvent'
  const userEvent = 'userEvent'
  const expect = 'expect'

  /**
   * e.g. `screen.getByRole('button', { name: 'Submit' })`
   * or just `document`
   */
  const selector = (() => {
    if (queryArg0 === 'document') {
      return 'document'
    }
    let index = ''
    if (eventData.indexIfMultipleFound !== undefined) {
      findMethod = findMethod.replace(/^getBy/, 'getAllBy')
      index = `[${eventData.indexIfMultipleFound}]`
    }
    return `${screen}.${findMethod}(${queryArgsStr})${index}`
  })()

  let mainLine = ''
  const requiredImports: Record<string, string> = {
    [screen]: testLibrary,
  }

  // When 'useExpect' is defined, generate an 'expect' statement
  if (useExpect) {
    // Generate an 'expect' statement based on the selected type
    mainLine = (() => {
      switch (useExpect) {
        case 'toHaveValue': {
          const value = (eventData.text ?? '').replaceAll(/['\\]/g, (match) => {
            return `\\${match}`
          })
          return `${expect}(${selector}).toHaveValue('${value}')`
        }
        case 'toBeEnabled': {
          return `${expect}(${selector}).toBeEnabled()`
        }
        case 'minimal':
        default:
          return `${expect}(${selector})`
      }
    })()

    if (testFramework === 'vitest') {
      requiredImports[expect] = testFramework
    }
    if (testFramework === 'bun') {
      requiredImports[expect] = 'bun:test'
    }
  }
  // Otherwise, generate a userEvent call
  else if (useFireEvent) {
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

    mainLine = `${fireEvent}.${event}(${selector}${fireEventArgs})`

    requiredImports[fireEvent] = testLibrary
  }
  else if (!hasUserEventLib) {
    throw new Error('Cannot use userEvent without @testing-library/user-event installed')
  }
  else {
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

    mainLine = `await ${userEvent}.${event}(${selector}${userEventArgs})`

    if (event === 'keydown' && eventData.enterKeyPressed) {
      mainLine = `await ${userEvent}.keyboard('{enter}')`
    }

    requiredImports[userEvent] = '@testing-library/user-event'
  }

  const importCode = Object.entries(requiredImports).map(([importName, from]) => {
    if (from === 'vitest') {
      // Workaround: we can't import vitest in the debug expressions because it can't be imported with 'require',
      // so run the global 'expect' function (using `vitest --globals` flag),
      // but still generate the import code after the recording session.
      return ''
    }

    // user-event v13 is used when running the debug expressions, because it's the last version
    // where the methods were synchronous e.g. `userEvent.click(...);`.
    // Newer versions use async code e.g. `await userEvent.click(...);`,
    // which fail when running through the debugger's 'evaluate' request.
    if (from === '@testing-library/user-event') {
      from = userEventLibPath
      return `const ${importName} = globalThis.require('${from}').default;`
    }
    return `const { ${importName} } = globalThis.require('${from}');`
  }).filter(Boolean).join('\n')

  const code = [mainLine]

  // Clear the input before typing when the 'clearBeforeType' flag is set
  if (event === 'type' && eventData.clearBeforeType) {
    code.unshift(`await ${userEvent}.clear(${selector})`)
  }

  // The fireEvent or userEvent statement to run in the debugger.
  // May be slightly different than the code that is actually generated for the user.
  const debugEventStatement = (() => {
    const result = code.map(line => line.replace(/\s*await\s*/, '')).join('\n') // No 'awaits' allowed in debug expressions

    // When writing react tests with userEvent v13, wrap in 'act'.
    if (testLibrary === '@testing-library/react' && !useFireEvent && !useExpect) {
      return `globalThis.require('react').act(() => { ${result} });`
    }
    return result
  })()

  // Replicate the input event from the webview to the test runtime.
  // We do this through a debug expression, which is the same as running code through vscode's 'Debug Terminal'.
  const debugExpression = `
(() => {
${importCode}
${debugEventStatement}
})()
`

  return {
    code,
    debugExpression,
    requiredImports,
  }
}
