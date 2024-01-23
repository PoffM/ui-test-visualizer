import syncFetch from "sync-fetch";
import { spyOnDomNodes } from "./dom-spies";

// Inject this code into the test process
let testWindow: Window = globalThis.window;
let lastHtml = "";
function updateHtml() {
  const newHtml = testWindow.document.documentElement.outerHTML;

  if (newHtml === lastHtml) {
    return;
  }

  try {
    // TODO find a less hacky way to do this than sync-fetch? If it causes problems.
    syncFetch(`http://localhost:${process.env.HTML_UPDATER_PORT}`, {
      method: "POST",
      body: newHtml,
      headers: {
        "Content-Type": "text/html",
      },
    });
  } catch (error) {
    console.error(error);
  } finally {
    lastHtml = newHtml;
  }
}

if (testWindow) {
  spyOnDomNodes(updateHtml);
}

// Hook into the window which is set by happy-dom or jsdom
Object.defineProperty(globalThis, "window", {
  get() {
    return testWindow;
  },
  set(newWindow: Window) {
    if (newWindow !== testWindow) {
      testWindow = newWindow;
      spyOnDomNodes(updateHtml);
    }
  },
  configurable: true,
});
