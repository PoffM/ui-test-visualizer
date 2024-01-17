import { createEventListener } from "@solid-primitives/event-listener";
import * as webviewToolkit from "@vscode/webview-ui-toolkit";
import { Show, createEffect, createMemo, createSignal } from "solid-js";

// In order to use the Webview UI Toolkit web components they
// must be registered with the browser (i.e. webview) using the
// syntax below.
webviewToolkit
  .provideVSCodeDesignSystem()
  .register(webviewToolkit.vsCodeButton());

export function App() {
  // Receive the test DOM's HTML from the extension's back-end.
  const [testHtml, setTestHtml] = createSignal("");

  createEventListener(window, "message", (event) => {
    setTestHtml(String(event.data.newHtml));
  });

  const [shadowHost, setShadowHost] = createSignal<HTMLElement>(
    (<div />) as HTMLElement
  );

  const shadow = createMemo(() => shadowHost().attachShadow({ mode: "open" }));

  createEffect(() => {
    shadow().innerHTML = testHtml();
  });

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
              <div ref={setShadowHost} />
            </div>
          </Show>
        </div>
        <vscode-button appearance="primary">Button Text</vscode-button>
      </div>
    </div>
  );
}
