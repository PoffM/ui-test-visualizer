import {
  createEventSignal,
  makeEventListener,
} from "@solid-primitives/event-listener";
import * as webviewToolkit from "@vscode/webview-ui-toolkit";
import morphdom from "morphdom";
import { createEffect, createSignal } from "solid-js";
import type { HTMLPatch } from "../../extension/ui-back-end";
import { Resizable } from "./lib/Resizable";
import { applyHtmlPatch } from "./lib/html-patch";

// In order to use the Webview UI Toolkit web components they
// must be registered with the browser (i.e. webview) using the
// syntax below.
webviewToolkit
  .provideVSCodeDesignSystem()
  .register(webviewToolkit.vsCodeButton());

export function App() {
  const lastMessage = createEventSignal(window, "message");

  // Receive the test DOM's HTML from the extension's back-end.
  const [testHtml, setTestHtml] = createSignal<string | undefined>();

  createEffect(() => {
    const newHtml = lastMessage()?.data?.newHtml;
    if (newHtml) {
      setTestHtml(String(newHtml));
    }
  });

  const [firstPatchReceived, setFirstPatchReceived] = createSignal(false);

  const domParser = new DOMParser();

  function initShadow(host: HTMLDivElement) {
    const shadow = host.attachShadow({ mode: "open" });
    shadow.appendChild(
      domParser.parseFromString(
        "<html><head></head><body></body></html>",
        "text/html"
      ).children[0]!
    );

    // Default behavior: update the DOM incrementally by providing the whole target document:
    createEffect(() => {
      const html = testHtml();
      if (html) {
        morphdom(shadow, html);
      }
    });

    // For experimental fast mode: incrementally update the HTML:
    makeEventListener(window, "message", (event) => {
      setFirstPatchReceived(true);
      if (event.data.htmlPatch) {
        applyHtmlPatch(shadow, event.data.htmlPatch as HTMLPatch);
      }
    });
  }

  return (
    <div class="fixed inset-0 flex flex-col gap-4 justify-center items-center">
      <Resizable initialWidth={500}>
        <div class="relative h-[500px] bg-gray-500 bg-opacity-20 p-2">
          <div
            style={{ visibility: firstPatchReceived() ? "hidden" : "visible" }}
            class="absolute h-full w-full flex justify-center items-center"
          >
            Listening for test DOM mutations...
          </div>
          <div
            style={{ visibility: firstPatchReceived() ? "visible" : "hidden" }}
            class="absolute h-full w-full"
          >
            <div ref={initShadow} />
          </div>
        </div>
      </Resizable>
      {/* TODO additional controls */}
      <div class="w-[500px]"></div>
    </div>
  );
}
