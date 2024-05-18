import child_process, { type ForkOptions } from 'node:child_process'
import { findUpSync } from 'find-up'
import path from 'pathe'

function buildPath() {
  return process.env.NODE_ENV === 'test'
    ? String(findUpSync('build-prod/', { cwd: __dirname, type: 'directory' }))
    : __dirname
}

// Run this script into Vitest's CLI process using the NodeJS "--require" arg.
const origFork = child_process.fork
child_process.fork = function (modulePath: string, ...args) {
  const options = args.at(-1) as ForkOptions | undefined

  if (options) {
    options.execArgv = [
      ...(options.execArgv ?? []),
      '--require',
      path.resolve(buildPath(), 'ui-test-visualizer-test-setup.js'),
    ]
  }

  // @ts-expect-error "args" should be the correct type
  return origFork.apply(this, [modulePath, ...args])
}
