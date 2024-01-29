// Inject this code into the test process

import { getNodePath, serializeDomMutationArg } from "../dom-transport-utils";
import { HTMLPatch } from "../extension/ui-back-end";
import { MutationCallback, spyOnDomNodes } from "./dom-spies";

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

  let lastHtml = "";
  const updateHtml: MutationCallback = (node, prop, args) => {
    if (process.env.EXPERIMENTAL_FAST_MODE === "false") {
      const newHtml = testWindow.document.documentElement.outerHTML;

      if (newHtml === lastHtml) {
        return;
      }
      lastHtml = newHtml;

      try {
        client.send(newHtml);
      } catch (error) {
        console.error(error);
      }
    }

    if (process.env.EXPERIMENTAL_FAST_MODE === "true") {
      const nodePath = getNodePath(node, window.document);

      if (!nodePath) {
        throw new Error("Could not find node path for node");
      }

      const serializedArgs = args.map((it) =>
        serializeDomMutationArg(it, window)
      );

      const htmlPatch: HTMLPatch = {
        targetNodePath: nodePath,
        prop,
        args: serializedArgs,
      };

      try {
        client.send(JSON.stringify(htmlPatch));
      } catch (error) {
        console.error(error);
      }
    }
  };

  let testWindow: Window = globalThis.window;

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
}

// For when this file is "--require"d before the Vitest tests: Run immediatetely.
if (process.env.TEST_FRAMEWORK === "vitest") {
  preTest();
}

// Jest runs the default async function in the setupFiles.
module.exports = preTest;
