import { makeEventListener } from "@solid-primitives/event-listener";
import * as webviewToolkit from "@vscode/webview-ui-toolkit";
import { createSignal } from "solid-js";
import { updateDomReplica } from "../../dom-sync/replica/update-replica-dom";
import type { HTMLPatch } from "../../dom-sync/types";

// In order to use the Webview UI Toolkit web components they
// must be registered with the browser (i.e. webview) using the
// syntax below.
webviewToolkit
  .provideVSCodeDesignSystem()
  .register(webviewToolkit.vsCodeButton());

export function App() {
  const [firstPatchReceived, setFirstPatchReceived] = createSignal(false);

  function initShadow(host: HTMLDivElement) {
    const shadow = host.attachShadow({ mode: "open" });
    shadow.appendChild(
      new DOMParser().parseFromString(
        `<html style="height: 100%; overflow-y: scroll;"><head></head><body></body></html>`,
        "text/html"
      ).children[0]!
    );

    makeEventListener(window, "message", (event) => {
      setFirstPatchReceived(true);
      updateDomReplica(
        shadow,
        (event.data.htmlPatch as HTMLPatch) ?? (event.data.newHtml as string)
      );
    });
  }

  return (
    <div class="fixed inset-0 p-2 pt-[30px]">
      <div class="relative h-full w-full">
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
          <div ref={initShadow} class="h-full w-full" />
        </div>
      </div>
      {/* TODO additional controls */}
    </div>
  );
}
