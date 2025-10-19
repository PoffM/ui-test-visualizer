import { walk } from 'estree-walker'
import type { ParseResult } from 'oxc-parser'
import type { TestFrameworkInfo } from '../../framework-support/detect-test-framework'
import type { TestingLibrary } from '../../framework-support/detect-test-library'

export function createUITestCode(
  { program, word, frameworkInfo, testingLibrary, relativePathToSrc }:
  {
    program: ParseResult
    word: string
    frameworkInfo: TestFrameworkInfo
    testingLibrary: TestingLibrary
    relativePathToSrc: string
  },
): [Error, null] | [null, { exportName: string, testContent: string }] {
  const { exportName, isDefaultExport } = (() => {
    let result: string | null = null
    let isDefaultExport = false
    walk(program, {
      enter(node) {
        if (node.type === 'ExportNamedDeclaration' || node.type === 'ExportDefaultDeclaration') {
          const nodeName = node?.declaration?.name
            ?? node?.declaration?.id?.name
            ?? node?.declaration?.declarations?.[0]?.id?.name
            ?? node?.declaration?.declarations?.[0]?.name
          if (nodeName === word) {
            result = nodeName ?? null
            isDefaultExport = node.type === 'ExportDefaultDeclaration'
          }
        }
      },
    })

    return { exportName: result as string | null, isDefaultExport }
  })()

  if (!exportName) {
    return [new Error(`No valid export found. Must be an exported capitalized function name. Got ${word}`), null]
  }

  // React/Solid component convention: starts with capital letter
  if (!/^[A-Z]/.test(exportName)) {
    return [new Error(`Selection must be a capitalized identifier, e.g. a React component name. Got "${word}".`), null]
  }

  const fwImport = frameworkInfo.framework === 'bun' ? 'bun:test' : frameworkInfo.framework

  const isArrowRender = testingLibrary === '@solidjs/testing-library'

  // Create basic test content
  const testContent = `import { describe, it } from '${fwImport}'
import { render } from '${testingLibrary}'
import ${isDefaultExport ? exportName : `{ ${exportName} }`} from './${relativePathToSrc}'

describe('${exportName}', () => {
  it('basic usage', async () => {
    render(${isArrowRender ? `() => <${exportName} />` : `<${exportName} />`})
  })
})
`
  return [null, { exportName, testContent }]
}
