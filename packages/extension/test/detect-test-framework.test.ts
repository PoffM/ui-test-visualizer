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

  it('uses jest when specified', async () => {
    const result1 = await detectTestFramework(
      path.join(
        examplesPath,
        'jest-react/test/basic.test.tsx',
      ),
      'jest',
    )
    expect(result1).toEqual({
      binPath: path.join(examplesPath, 'jest-react/node_modules/jest/bin/jest.js'),
      configPath: path.join(examplesPath, 'jest-react/jest.config.ts'),
      framework: 'jest',
    })

    const result2 = await detectTestFramework(
      path.join(
        examplesPath,
        'jest-react-with-packagejson-config/test/basic.test.tsx',
      ),
      'jest',
    )
    expect(result2).toEqual({
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

  it('uses vitest when specified', async () => {
    const result = await detectTestFramework(
      path.join(
        examplesPath,
        'vitest-react/test/basic.test.tsx',
      ),
      'vitest',
    )
    expect(result).toEqual({
      binPath: path.join(examplesPath, 'vitest-react/node_modules/vitest/vitest.mjs'),
      configPath: path.join(examplesPath, 'vitest-react/vitest.config.ts'),
      framework: 'vitest',
    })
  })

  it('throws when vitest detection fails', async () => {
    await expect(
      detectTestFramework(
        path.join(
          examplesPath,
          'jest-react/test/basic.test.tsx',
        ),
        'vitest',
      ),
    ).rejects.toThrow('No Vitest config found')
  })

  it('throws when jest detection fails (in project with package.json)', async () => {
    await expect(
      detectTestFramework(
        path.join(
          examplesPath,
          'vitest-react/test/basic.test.tsx',
        ),
        'jest',
      ),
    ).rejects.toThrow('No Jest config found')
  })

  it('throws when jest detection fails (in project without package.json)', async () => {
    await expect(
      detectTestFramework(
        path.resolve('/'),
        'jest',
      ),
    ).rejects.toThrow('No Jest config found')
  })

  it('throws when autodetect fails', async () => {
    await expect(
      detectTestFramework(
        examplesPath, // some folder without a test framework
        'autodetect',
      ),
    ).rejects.toThrow('No Vitest or Jest config found')
  })
})
