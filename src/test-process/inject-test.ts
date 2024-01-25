import { spyOnDomNodes } from "./dom-spies";
import { Socket } from "net";

const client = new Socket({});
client.connect(Number(process.env.HTML_UPDATER_PORT), "localhost", () => {
  // Inject this code into the test process
  let testWindow: Window = globalThis.window;
  let lastHtml = "";
  function updateHtml() {
    const newHtml = testWindow.document.documentElement.outerHTML;

    if (newHtml === lastHtml) {
      return;
    }

    try {
      client.write(newHtml);
    } catch (error) {
      console.error(error);
    } finally {
      lastHtml = newHtml;
    }
  }

  if (testWindow) {
    spyOnDomNodes(() => void updateHtml());
  }

  // Hook into the window which is set by happy-dom or jsdom
  Object.defineProperty(globalThis, "window", {
    get() {
      return testWindow;
    },
    set(newWindow: Window) {
      if (newWindow !== testWindow) {
        testWindow = newWindow;
        spyOnDomNodes(() => void updateHtml());
      }
    },
    configurable: true,
  });
});
