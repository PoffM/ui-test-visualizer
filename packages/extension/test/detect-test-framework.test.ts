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
      configPath: path.join(
        examplesPath,
        'jest-react-with-packagejson-config/package.json',
      ),
      framework: 'jest',
    })
  })

  it('detects Jest config in a Next.js project', async () => {
    const result = await detectTestFramework(
      path.join(
        examplesPath,
        'jest-nextjs/app/counter.test.tsx',
      ),
      'autodetect',
    )
    expect(result).toEqual({
      configPath: path.join(examplesPath, 'jest-nextjs/jest.config.ts'),
      framework: 'jest',
    })
  })

  it('detects vitest config file', async () => {
    const result = await detectTestFramework(
      path.join(
        examplesPath,
        'vitest-react-tailwind4/test/basic.test.tsx',
      ),
      'autodetect',
    )
    expect(result).toEqual({
      configPath: path.join(examplesPath, 'vitest-react-tailwind4/vite.config.ts'),
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
        'vitest-react-tailwind4/test/basic.test.tsx',
      ),
      'vitest',
    )
    expect(result).toEqual({
      configPath: path.join(examplesPath, 'vitest-react-tailwind4/vite.config.ts'),
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
          'vitest-react-tailwind4/test/basic.test.tsx',
        ),
        'jest',
      ),
    ).rejects.toThrow('No Jest config found')
  })

  it('throws when jest detection fails (in project without package.json)', async () => {
    await expect(
      detectTestFramework(
        path.resolve('/not-a-real-file'),
        'jest',
      ),
    ).rejects.toThrow('Could not find related package.json for test file /not-a-real-file')
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
