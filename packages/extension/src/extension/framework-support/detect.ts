import path from 'pathe'
import { findUp } from 'find-up'
import { z } from 'zod'
import { readInitialOptions } from 'jest-config'
import { extensionSetting } from '../util/extension-setting'
import { getJestBinPath } from './jest-support'
import { getVitestBinPath } from './vitest-support'

export interface TestFrameworkInfo {
  framework: 'jest' | 'vitest'
  configPath: string
  binPath: string
}

export async function detectTestFramework(
  testFilePath: string,
): Promise<TestFrameworkInfo> {
  const frameworkSetting = (() => {
    const parsed = z.enum(['autodetect', 'vitest', 'jest'])
      .safeParse(extensionSetting('ui-test-visualizer.testFramework'))
    return parsed.success ? parsed.data : 'autodetect'
  })()

  // auto detect test config files

  const vitestFile = (frameworkSetting === 'autodetect' || frameworkSetting === 'vitest')
    ? await findUp(VITEST_CONFIG_FILES, { cwd: testFilePath })
    : undefined

  const jestFile = (frameworkSetting === 'autodetect' || frameworkSetting === 'jest')
    ? await (async () => {
      const cwd = process.cwd()
      try {
        process.chdir(path.dirname(testFilePath))
        const cfg = await readInitialOptions(undefined, {})
        if (
          cfg.configPath?.endsWith('/package.json')

          // check for { rootDir: '/...' } ; the empty config placeholder
          && Object.keys(cfg.config).length <= 1
        ) {
          // no jest config found in package.json
          return undefined
        }
        return cfg.configPath
      }
      catch {
        // readInitialOptions throws an error if it can't find jest.config.x or package.json
        // ignore the error
        return undefined
      }
      finally {
        process.chdir(cwd)
      }
    })()
    : undefined

  const configPath = vitestFile ?? jestFile

  // throw error if no config file found
  if (!configPath) {
    switch (frameworkSetting) {
      case 'autodetect':
        throw new Error('No Vitest or Jest config found')
      case 'vitest':
        throw new Error('No Vitest config found')
      case 'jest':
        throw new Error('No Jest config found')
    }
  }

  // choose the config file with the deepest path

  const vitestCfgPathLength = vitestFile?.split(path.sep).length ?? 0
  const jestConfigPathLength = jestFile?.split(path.sep).length ?? 0

  if (vitestCfgPathLength > jestConfigPathLength) {
    return {
      framework: 'vitest' as const,
      configPath,
      binPath: await getVitestBinPath(testFilePath),
    }
  }
  else {
    return {
      framework: 'jest' as const,
      configPath,
      binPath: await getJestBinPath(testFilePath),
    }
  }
}

const VITEST_CONFIG_NAMES = ['vitest.config', 'vite.config']

const VITEST_CONFIG_EXTENSIONS = ['.ts', '.mts', '.cts', '.js', '.mjs', '.cjs']

const VITEST_CONFIG_FILES = VITEST_CONFIG_NAMES.flatMap(name =>
  VITEST_CONFIG_EXTENSIONS.map(ext => name + ext),
)
