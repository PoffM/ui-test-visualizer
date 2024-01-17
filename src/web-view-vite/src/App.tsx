import { createEventSignal } from "@solid-primitives/event-listener";
import * as webviewToolkit from "@vscode/webview-ui-toolkit";
import { Show, createEffect, createMemo } from "solid-js";

// In order to use the Webview UI Toolkit web components they
// must be registered with the browser (i.e. webview) using the
// syntax below.
webviewToolkit
  .provideVSCodeDesignSystem()
  .register(webviewToolkit.vsCodeButton());

export function App() {
  // Receive the test DOM's HTML from the extension's back-end.
  const lastMessage = createEventSignal(window, "message");
  const testHtml = createMemo(() => String(lastMessage()?.data?.newHtml));

  function shadowHostRef(el: HTMLElement) {
    const shadow = el.attachShadow({ mode: "open" });
    createEffect(() => (shadow.innerHTML = testHtml()));
  }

  return (
    <div class="fixed inset-0 flex justify-center items-center">
      <div class="flex flex-col gap-4 w-[500px] max-w-[100vw]">
        <div class="h-[500px] bg-gray-500 bg-opacity-20">
          <Show
            when={testHtml()}
            fallback={
              <div class="h-full w-full flex justify-center items-center">
                Waiting for HTML to be set into the test DOM...
              </div>
            }
          >
            <div class="h-full w-full">
              <div ref={shadowHostRef} />
            </div>
          </Show>
        </div>
        <vscode-button appearance="primary">Button Text</vscode-button>
      </div>
    </div>
  );
}
