import { startApp } from "../app/app";
import { importVitestDep } from "./import-utils";

// Inject this code into the vitest-explorer's test worker process using the NodeJS "--require" arg.

let html: string | null = null;
function updateHtml(newHtml: string) {
  html = newHtml;
}

(async () => {
  let testWindow: Window = globalThis.window;
  const { default: MutationListener } = await importVitestDep(
    "happy-dom",
    "happy-dom/lib/mutation-observer/MutationListener.js"
  );

  const origReport = MutationListener.prototype.report;
  MutationListener.prototype.report = function (...args: unknown[]) {
    updateHtml(testWindow.document.documentElement.outerHTML);
    console.log("mutation", ...args);
    origReport.call(this, ...args);
  };

  // Hook into the window which is set by happy-dom or jsdom
  Object.defineProperty(globalThis, "window", {
    get() {
      return testWindow;
    },
    set(newWindow: Window) {
      if (!testWindow) {
        startApp();
      }
      if (newWindow !== testWindow) {
        new MutationObserver((mutations) => {
          mutations.forEach(() => {});
        }).observe(newWindow.document, {
          childList: true,
          attributes: true,
          characterData: true,
          subtree: true,
        });
      }
      testWindow = newWindow;
    },
    configurable: true,
  });
})();
