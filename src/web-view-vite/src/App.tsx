import { createEventSignal } from "@solid-primitives/event-listener";
import * as webviewToolkit from "@vscode/webview-ui-toolkit";
import { Show, createEffect, createSignal } from "solid-js";
import { Resizable } from "./lib/Resizable";

// In order to use the Webview UI Toolkit web components they
// must be registered with the browser (i.e. webview) using the
// syntax below.
webviewToolkit
  .provideVSCodeDesignSystem()
  .register(webviewToolkit.vsCodeButton());

export function App() {
  const lastMessage = createEventSignal(window, "message");

  // Receive the test DOM's HTML from the extension's back-end.
  const [testHtml, setTestHtml] = createSignal<string>("");
  createEffect(() => {
    if (lastMessage()?.data?.newHtml) {
      setTestHtml(String(lastMessage().data.newHtml));
    }
  });

  /** Display the test's HTML with isolated CSS. */
  function initShadowDom(el: HTMLDivElement) {
    const shadow = el.attachShadow({ mode: "open" });
    createEffect(() => (shadow.innerHTML = testHtml()));
  }

  return (
    <div class="fixed inset-0 flex flex-col gap-4 justify-center items-center">
      <Resizable initialWidth={500}>
        <div class="h-[500px] bg-gray-500 bg-opacity-20 p-2">
          <Show
            when={testHtml()}
            fallback={
              <div class="h-full w-full flex justify-center items-center">
                Listening for test DOM mutations...
              </div>
            }
          >
            <div class="h-full w-full">
              <div ref={initShadowDom} />
            </div>
          </Show>
        </div>
      </Resizable>
      {/* TODO additional controls */}
      <div class="w-[500px]"></div>
    </div>
  );
}
