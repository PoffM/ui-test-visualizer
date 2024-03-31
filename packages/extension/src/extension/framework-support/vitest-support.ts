import path from 'pathe'
import { findUp } from 'find-up'
import type * as vscode from 'vscode'
import { cleanTestNameForTerminal } from './util'

/** Extra debug config to pass into the VSCode debug process when using Vitest. */
export async function vitestDebugConfig(
  filePath: string,
  testName: string,
): Promise<Partial<vscode.DebugConfiguration>> {
  return {
    program: await getVitestBinPath(filePath),
    runtimeArgs: ['--require', path.join(__dirname, 'inject-cli.js')],
    args: [
      // The Vitest "run" command
      'run',
      filePath,
      '-t',
      cleanTestNameForTerminal(testName),
      // Use child process instead of the default threads.
      '--pool',
      'forks',
      '--poolOptions.forks.minForks',
      '1',
      '--poolOptions.forks.maxForks',
      '1',
    ],
    autoAttachChildProcesses: true,
    // TODO use the config
    skipFiles: [
      '**/node_modules/**',
      '**/dist/**',
      '**/cypress/**',
      '**/.{idea,git,cache,output,temp}/**',
    ],
    smartStep: true,
  }
}

const lookupPaths = [
  'node_modules/vitest/vitest.mjs',
  'node_modules/.bin/vitest.js',
  'node_modules/.bin/vitest.cmd',
]

export async function getVitestBinPath(filepath: string) {
  let vitestPath: string | undefined
  for (const lookupPath of lookupPaths) {
    vitestPath = await findUp(lookupPath, { cwd: filepath })
    if (vitestPath) {
      return vitestPath
    }
  }

  throw new Error(`Could not find Vitest bin file in ${lookupPaths}`)
}
