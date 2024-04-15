import path from 'pathe'
import { findUp } from 'find-up'
import { getJestBinPath } from './jest-support'
import { getVitestBinPath } from './vitest-support'

export interface TestFrameworkInfo {
  framework: 'jest' | 'vitest'
  configPath: string
  binPath: string
  setupFiles?: string[]
}

export async function detectTestFramework(
  testFilePath: string,
): Promise<TestFrameworkInfo> {
  const vitestFile = await findUp(vitestConfigFiles, { cwd: testFilePath })
  const jestFile = await findUp(
    [
      'jest.config.js',
      'jest.config.ts',
      'jest.config.cjs',
      'jest.config.mjs',
      'jest.config.json',
    ],
    { cwd: testFilePath },
  )

  const configPath = vitestFile ?? jestFile

  if (!configPath) {
    throw new Error('No Vitest or Jest config found')
  }

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

const CONFIG_NAMES = ['vitest.config', 'vite.config']

const CONFIG_EXTENSIONS = ['.ts', '.mts', '.cts', '.js', '.mjs', '.cjs']

export const vitestConfigFiles = CONFIG_NAMES.flatMap(name =>
  CONFIG_EXTENSIONS.map(ext => name + ext),
)
