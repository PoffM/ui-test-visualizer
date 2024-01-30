// Inject this code into the test process

import { initPrimaryDom } from "../dom-sync/primary/init-primary-dom";

// Importing WebSocket directly from "ws" in a Jest process throws an error because
// "ws" wrongly thinks it's in a browser environment. Import from the index.js file
// directly instead to bypass that check.
const WebSocket =
  require("../../node_modules/ws/index.js") as typeof globalThis.WebSocket;

async function preTest() {
  const client = new WebSocket(
    `ws://localhost:${process.env.HTML_UPDATER_PORT}`
  );

  // Wait for the WebSocket to connect before continuing the test setup.
  await new Promise<void>((res) => {
    client.addEventListener("open", () => res());
  });

  let testWindow: Window = globalThis.window;

  function initDom() {
    initPrimaryDom({
      root: testWindow,
      ...(process.env.EXPERIMENTAL_FAST_MODE === "true"
        ? {
            patchMode: true,
            onMutation: (htmlPatch) => client.send(JSON.stringify(htmlPatch)),
          }
        : {
            patchMode: false,
            onMutation: (newHtml) => client.send(newHtml),
          }),
    });
  }

  if (testWindow) {
    initDom();
  }

  // Hook into the window which is set by happy-dom or jsdom
  Object.defineProperty(globalThis, "window", {
    get() {
      return testWindow;
    },
    set(newWindow: Window) {
      if (newWindow !== testWindow) {
        testWindow = newWindow;
        initDom();
      }
    },
    configurable: true,
  });
}

// For when this file is "--require"d before the Vitest tests: Run immediatetely.
if (process.env.TEST_FRAMEWORK === "vitest") {
  preTest();
}

// Jest runs the default async function in the setupFiles.
module.exports = preTest;
