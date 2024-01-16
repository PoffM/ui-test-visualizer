import * as webviewToolkit from "@vscode/webview-ui-toolkit";

// In order to use the Webview UI Toolkit web components they
// must be registered with the browser (i.e. webview) using the
// syntax below.
webviewToolkit
  .provideVSCodeDesignSystem()
  .register(webviewToolkit.vsCodeButton());

export function App() {
  return (
    <div class="fixed inset-0 flex justify-center items-center">
      <div class="flex flex-col gap-4">
        <div class="h-[500px] w-[500px] bg-gray-500 bg-opacity-20">hello</div>
        <vscode-button appearance="primary">Button Text</vscode-button>
      </div>
    </div>
  );
}
