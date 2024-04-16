import { describe, expect, it } from 'vitest'
import path from 'pathe'
import { detectTestFramework } from '../src/extension/framework-support/detect'

const examplesPath = path.join(__dirname, '../../../examples')

describe('detectTestFramework', () => {
  it('detects jest config file', async () => {
    const result = await detectTestFramework(
      path.join(
        examplesPath,
        'jest-react/test/basic.test.tsx',
      ),
      'autodetect',
    )
    expect(result).toEqual({
      binPath: path.join(examplesPath, 'jest-react/node_modules/jest/bin/jest.js'),
      configPath: path.join(examplesPath, 'jest-react/jest.config.ts'),
      framework: 'jest',
    })
  })

  it('detects jest package.json config', async () => {
    const result = await detectTestFramework(
      path.join(
        examplesPath,
        'jest-react-with-packagejson-config/test/basic.test.tsx',
      ),
      'autodetect',
    )
    expect(result).toEqual({
      binPath: path.join(
        examplesPath,
        'jest-react-with-packagejson-config/node_modules/jest/bin/jest.js',
      ),
      configPath: path.join(
        examplesPath,
        'jest-react-with-packagejson-config/package.json',
      ),
      framework: 'jest',
    })
  })

  it('detects vitest config file', async () => {
    const result = await detectTestFramework(
      path.join(
        examplesPath,
        'vitest-react/test/basic.test.tsx',
      ),
      'autodetect',
    )
    expect(result).toEqual({
      binPath: path.join(examplesPath, 'vitest-react/node_modules/vitest/vitest.mjs'),
      configPath: path.join(examplesPath, 'vitest-react/vitest.config.ts'),
      framework: 'vitest',
    })
  })
})
