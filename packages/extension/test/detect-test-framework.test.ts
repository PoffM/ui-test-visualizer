import { describe, expect, it } from 'vitest'
import path from 'pathe'
import { detectTestFramework } from '../src/framework-support/detect-test-framework'

const examplesPath = path.join(__dirname, '../../../examples')
const vitestExamples = [
  { folder: 'vitest2-react-tailwind3', config: 'vitest.config.ts' },
  { folder: 'vitest4-react-tailwind4', config: 'vite.config.ts' },
  { folder: 'vitest5-react-tailwind4', config: 'vite.config.ts' },
]

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

  it('detects Jest config in a Next.js + ts-node project', async () => {
    const result = await detectTestFramework(
      path.join(
        examplesPath,
        'jest-nextjs-ts-node/app/counter.test.tsx',
      ),
      'autodetect',
    )
    expect(result).toEqual({
      configPath: path.join(examplesPath, 'jest-nextjs-ts-node/jest.config.ts'),
      framework: 'jest',
    })
  })

  it('detects Jest config in a Next.js project', async () => {
    const result = await detectTestFramework(
      path.join(
        examplesPath,
        'jest-nextjs-minimal/app/counter.test.tsx',
      ),
      'autodetect',
    )
    expect(result).toEqual({
      configPath: path.join(examplesPath, 'jest-nextjs-minimal/jest.config.ts'),
      framework: 'jest',
    })
  })

  it.each(vitestExamples)('detects vitest config file in $folder', async ({ folder, config }: typeof vitestExamples[number]) => {
    const result = await detectTestFramework(
      path.join(
        examplesPath,
        `${folder}/test/basic.test.tsx`,
      ),
      'autodetect',
    )
    expect(result).toEqual({
      configPath: path.join(examplesPath, `${folder}/${config}`),
      framework: 'vitest',
    })
  })

  it('detects bun.lock file', async () => {
    const result = await detectTestFramework(
      path.join(
        examplesPath,
        'bun-react/test/basic.test.tsx',
      ),
      'autodetect',
    )
    expect(result).toEqual({
      configPath: path.join(examplesPath, 'bun-react/bun.lock'),
      framework: 'bun',
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

  it.each(vitestExamples)('uses vitest when specified in $folder', async ({ folder, config }: typeof vitestExamples[number]) => {
    const result = await detectTestFramework(
      path.join(
        examplesPath,
        `${folder}/test/basic.test.tsx`,
      ),
      'vitest',
    )
    expect(result).toEqual({
      configPath: path.join(examplesPath, `${folder}/${config}`),
      framework: 'vitest',
    })
  })

  it('uses Bun when specified', async () => {
    const result = await detectTestFramework(
      path.join(
        examplesPath,
        'bun-react/test/basic.test.tsx',
      ),
      'bun',
    )
    expect(result).toEqual({
      configPath: path.join(examplesPath, 'bun-react/bun.lock'),
      framework: 'bun',
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
          'vitest5-react-tailwind4/test/basic.test.tsx',
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
    ).rejects.toThrow('Test framework auto-detection failed. Requires Vitest or Jest config, or a Bun lockfile. Or manually specify the test framework in the extension\'s settings.')
  })
})
