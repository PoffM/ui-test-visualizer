import path from 'node:path'
import child_process, { type ForkOptions } from 'node:child_process'

// Inject this code Vitest's CLI process using the NodeJS "--require" arg.
const origFork = child_process.fork
child_process.fork = function (modulePath: string, ...args) {
  const options = args.at(-1) as ForkOptions | undefined

  if (options) {
    options.execArgv = [
      ...(options.execArgv ?? []),
      '--require',
      path.resolve(__dirname, 'inject-test.js'),
    ]
  }

  // @ts-expect-error "args" should be the correct type
  return origFork.apply(this, [modulePath, ...args])
}
