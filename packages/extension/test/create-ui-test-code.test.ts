import { parseSync } from 'oxc-parser'
import { describe, expect, it } from 'vitest'
import type { SupportedFramework } from '../src/framework-support/detect-test-framework'
import type { TestingLibrary } from '../src/framework-support/detect-test-library'
import { createUITestCode } from '../src/recorder/create-new-test-file/create-ui-test-code'

const program = parseSync('my-component.ts', 'export function MyComponent() {}', {}).program

function input(
  framework: SupportedFramework,
  testingLibrary: TestingLibrary,
): Parameters<typeof createUITestCode>[0] {
  return {
    program,
    word: 'MyComponent',
    frameworkInfo: {
      framework,
      configPath: '',
    },
    relativePathToSrc: 'my-component',
    testingLibrary,
  }
}

describe('createUITestCode', () => {
  it('jest+react', () => {
    const [_, result] = createUITestCode(input('jest', '@testing-library/react'))
    expect(result).toEqual({
      exportName: 'MyComponent',
      testContent: `import { render } from '@testing-library/react'
import { MyComponent } from './my-component'

test('basic usage', async () => {
  (() => render(<MyComponent />))()
})
`,
    })
  })

  it('vitest+solid', () => {
    const [_, result] = createUITestCode(input('vitest', '@solidjs/testing-library'))
    expect(result).toEqual({
      exportName: 'MyComponent',
      testContent: `import { test } from 'vitest'
import { render } from '@solidjs/testing-library'
import { MyComponent } from './my-component'

test('basic usage', async () => {
  (() => render(() => <MyComponent />))()
})
`,
    })
  })

  it('bun+react', () => {
    const [_, result] = createUITestCode(input('bun', '@testing-library/react'))
    expect(result).toEqual({
      exportName: 'MyComponent',
      testContent: `import { test } from 'bun:test'
import { render } from '@testing-library/react'
import { MyComponent } from './my-component'

test('basic usage', async () => {
  (() => render(<MyComponent />))()
})
`,
    })
  })
})
