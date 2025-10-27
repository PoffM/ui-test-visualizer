import { findUp, findUpSync } from 'find-up'
import { readInitialOptions } from 'jest-config'
import path from 'pathe'
import type * as vscode from 'vscode'
import type { TestFrameworkInfo } from './detect-test-framework'
import { cleanTestNameForTerminal } from './util'

function buildPath() {
  return process.env.NODE_ENV === 'test'
    ? String(findUpSync('build-prod/', { cwd: __dirname, type: 'directory' }))
    : __dirname
}

export async function jestDebugConfig(
  filePath: string,
  testName: string,
  fw: TestFrameworkInfo,
): Promise<Partial<vscode.DebugConfiguration>> {
  await assertCompatibleJestVersion(filePath)

  const cwd = process.cwd()
  const jestOptions = await (async () => {
    try {
      process.chdir(path.dirname(fw.configPath))
      return await readInitialOptions(fw.configPath)
    }
    finally {
      process.chdir(cwd)
    }
  })()

  const setupFiles = ((jestOptions.config.setupFiles ?? []) as string[])
    .map((file) => {
      // Convert relative paths to absolute paths, but keep package names as-is.
      // Examples:
      //   './jest.setup.ts' -> '/path/to/my-project/jest.setup.ts'
      //   '<rootDir>/jest.setup.ts' -> '<rootDir>/jest.setup.ts'
      //   'jest-canvas-mock' -> 'jest-canvas-mock'
      const adjustedPath = (file.startsWith('./') || file.startsWith('../') || path.isAbsolute(file))
        ? path.join(path.dirname(fw.configPath), file)
        : file
      return adjustedPath
    })

  return {
    args: [
      'jest',
      filePath,
      '--config',
      fw.configPath,
      '--testNamePattern',
      cleanTestNameForTerminal(testName),
      '--runInBand',
      '--testTimeout=1000000000',
      '--silent=false',
      '--setupFiles',
      path.join(buildPath(), 'test-runtime-setup.js'),
      ...setupFiles,
      '--detectOpenHandles',
      // TODO find out why Jest doesn't exit on its own
      '--forceExit',
      '--colors', // Show green text for the 'pass text' TODO find out why the rest is always red
    ],
    autoAttachChildProcesses: true,
  }
}

/** Require Jest version 28+ */
async function assertCompatibleJestVersion(testFile: string) {
  const pkg = await findUp('node_modules/jest/package.json', {
    cwd: testFile,
  })
  if (!pkg) {
    return
  }
  // eslint-disable-next-line ts/no-var-requires, ts/no-require-imports
  const jestPkg = require(pkg)
  const version = jestPkg.version

  if (!version) {
    return
  }

  const [major] = jestPkg.version.split('.')

  const majorNum = Number(major)

  if (majorNum < 28) {
    const msg = `Jest version must be 28 or higher, found ${jestPkg.version}.
When using Jest, this extension relies on support for "setupFiles" to export an async function, introduced in Jest 28.
https://github.com/jestjs/jest/releases/tag/v28.0.0-alpha.6`
    console.error(msg)
    throw new Error(msg)
  }
}
