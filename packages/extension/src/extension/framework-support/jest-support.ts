import path from 'pathe'
import { findUp } from 'find-up'
import type * as vscode from 'vscode'
import { readInitialOptions } from 'jest-config'
import { detectTestFramework } from './detect'
import { cleanTestNameForTerminal } from './util'

export async function jestDebugConfig(
  filePath: string,
  testName: string,
): Promise<Partial<vscode.DebugConfiguration>> {
  await assertCompatibleJestVersion(filePath)

  const fw = await detectTestFramework(filePath)

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
    .map(file => path.resolve(file))

  return {
    program: fw.binPath,
    autoAttachChildProcesses: true,
    args: [
      filePath,
      '--config',
      fw.configPath,
      '--testNamePattern',
      cleanTestNameForTerminal(testName),
      '--runInBand',
      '--testTimeout=1000000000',
      '--silent=false',
      '--setupFiles',
      path.join(__dirname, 'ui-test-visualizer-test-setup.js'),
      ...setupFiles,
      '--detectOpenHandles',
      // TODO find out why Jest doesn't exit on its own
      '--forceExit',
    ],
  }
}

const lookupPaths = ['node_modules/jest/bin/jest.js', 'node_modules/.bin/jest']

export async function getJestBinPath(filepath: string) {
  let jestPath: string | undefined
  for (const lookupPath of lookupPaths) {
    jestPath = await findUp(lookupPath, { cwd: filepath })
    if (jestPath) {
      return jestPath
    }
  }

  throw new Error(`Could not find Jest bin file in ${lookupPaths}`)
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
