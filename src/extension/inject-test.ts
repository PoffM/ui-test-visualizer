import { importVitestDep } from "./import-utils";

// Inject this code into the vitest-explorer's test worker process using the NodeJS "--require" arg.

async function updateHtml(newHtml: string) {
  try {
    await fetch(`http://localhost:${process.env.HTML_UPDATER_PORT}`, {
      method: "POST",
      body: newHtml,
      headers: {
        "Content-Type": "text/html",
      },
    });
  } catch (error) {
    console.error(error);
  }
}

(async () => {
  let testWindow: Window = globalThis.window;
  const { default: MutationListener } = await importVitestDep(
    "happy-dom",
    "happy-dom/lib/mutation-observer/MutationListener.js"
  );

  const origReport = MutationListener.prototype.report;
  MutationListener.prototype.report = function (...args: unknown[]) {
    void updateHtml(testWindow.document.documentElement.outerHTML);
    origReport.call(this, ...args);
  };

  // Hook into the window which is set by happy-dom or jsdom
  Object.defineProperty(globalThis, "window", {
    get() {
      return testWindow;
    },
    set(newWindow: Window) {
      if (!testWindow) {
        // TODO initial setup from the test process
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
