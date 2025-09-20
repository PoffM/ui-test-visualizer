import { findUpSync } from 'find-up'
import path from 'pathe'
import type * as vscode from 'vscode'
import { cleanTestNameForTerminal } from './util'

function buildPath() {
  return process.env.NODE_ENV === 'test'
    ? String(findUpSync('build-prod/', { cwd: __dirname, type: 'directory' }))
    : __dirname
}

/** Extra debug config to pass into the VSCode debug process when using Vitest. */
export async function vitestDebugConfig(
  filePath: string,
  testName: string,
): Promise<Partial<vscode.DebugConfiguration>> {
  return {
    env: {
      NODE_OPTIONS: `--require ${path.join(buildPath(), 'ui-test-visualizer-cli-setup.js')}`,
    },
    args: [
      'vitest',
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
      '--testTimeout=0',
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
