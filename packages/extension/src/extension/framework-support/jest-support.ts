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
