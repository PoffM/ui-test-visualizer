// Copied from:
// https://github.com/microsoft/vscode-webview-ui-toolkit-samples/blob/main/frameworks/hello-world-solidjs/webview-ui/src/toolkit.d.ts

import 'solid-js'

// An important part of getting the Webview UI Toolkit to work with
// Solid + TypeScript + JSX is to extend the solid-js JSX.IntrinsicElements
// type interface to include type annotations for each of the toolkit's components.
//
// Without this, type errors will occur when you try to use any toolkit component
// in your Solid + TypeScript + JSX component code. (Note that this file shouldn't be
// necessary if you're not using TypeScript or are using tagged template literals
// instead of JSX for your Solid component code).
//
// Important: This file should be updated whenever a new component is added to the
// toolkit. You can find a list of currently available toolkit components here:
//
// https://github.com/microsoft/vscode-webview-ui-toolkit/blob/main/docs/components.md
//
declare module 'solid-js' {
  namespace JSX {
    interface IntrinsicElements {
      'ui-test-visualizer-badge': any
      'ui-test-visualizer-button': any
      'ui-test-visualizer-checkbox': any
      'ui-test-visualizer-data-grid': any
      'ui-test-visualizer-divider': any
      'ui-test-visualizer-dropdown': any
      'ui-test-visualizer-link': any
      'ui-test-visualizer-option': any
      'ui-test-visualizer-panels': any
      'ui-test-visualizer-progress-ring': any
      'ui-test-visualizer-radio': any
      'ui-test-visualizer-radio-group': any
      'ui-test-visualizer-tag': any
      'ui-test-visualizer-text-area': any
      'ui-test-visualizer-text-field': any
    }
  }
}
