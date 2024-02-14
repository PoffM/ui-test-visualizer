import { findUp } from 'find-up'
import type * as vscode from 'vscode'
import { detectTestFramework } from './detect'
import { cleanTestNameForTerminal } from './util'

export async function jestDebugConfig(
  filePath: string,
  testName: string,
): Promise<vscode.DebugConfiguration> {
  const fw = await detectTestFramework(filePath)

  return {
    name: 'Visually Debug UI',
    request: 'launch',
    type: 'pwa-node',
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
      await findUp('dist/inject-test.js', { cwd: __filename }),
      ...(fw.setupFiles ?? []),
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
