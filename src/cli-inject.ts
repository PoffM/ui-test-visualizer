import path from "path";
import child_process, { type ForkOptions } from "child_process";

console.log("injected into vitest cli");

(async () => {
  const origFork = child_process.fork;
  child_process.fork = function (modulePath: string, ...args) {
    const options = args.at(-1) as ForkOptions | undefined;

    if (options) {
      options.execArgv = [
        ...(options.execArgv ?? []),
        "--require",
        path.resolve(__dirname, "test-inject.js"),
      ];
    }

    // @ts-expect-error
    return origFork.apply(this, [modulePath, ...args]);
  };
})();
