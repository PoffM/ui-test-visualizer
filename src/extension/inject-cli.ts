import path from "path";
import child_process, { type ForkOptions } from "child_process";

// Inject this code the vitest-explorer's CLI process using the NodeJS "--require" arg.
(async () => {
  const origFork = child_process.fork;
  child_process.fork = function (modulePath: string, ...args) {
    const options = args.at(-1) as ForkOptions | undefined;

    if (options) {
      options.execArgv = [
        ...(options.execArgv ?? []),
        "--require",
        path.resolve(__dirname, "inject-test.js"),
      ];
    }

    // @ts-expect-error
    return origFork.apply(this, [modulePath, ...args]);
  };
})();
