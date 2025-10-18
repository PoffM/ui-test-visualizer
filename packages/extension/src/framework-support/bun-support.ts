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
export async function bunDebugConfig(
  filePath: string,
  testName: string,
): Promise<Partial<vscode.DebugConfiguration>> {
  return {
    type: 'bun',
    runtimeExecutable: 'bun',
    args: [
      '--conditions=browser',
      'test',
      '--preload',
      path.join(buildPath(), 'bun-preload.js'),
      filePath,
      '--test-name-pattern',
      cleanTestNameForTerminal(testName),
      '--timeout=0',
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
