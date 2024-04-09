# UI Test Visualizer

Visually step through your jsdom or happy-dom based UI tests.

This is a VSCode extension: no code changes should be required to watch your UI tests.

- TODO demo video

## Workspace Requirements

- [Vitest](https://vitest.dev/) or [Jest](https://jestjs.io/)
  - Your test framework is auto-detected by walking up the directories from your test file until it finds `vitest.config.{ts,js}`, `vite.config.{ts,js}`, or `jest.config.{ts,js,json}`.
- [jsdom](https://github.com/jsdom/jsdom) or [happy-dom](https://github.com/capricorn86/happy-dom) test environment (what you're probably already using for UI in Vitest or Jest)

## Usage

Click the "Visually Debug UI" button above your test. If there's no breakpoint in your test already, the extension will add one automatically. A side panel should open, and render your UI as you step through with the debugger.

## UI Framework Compatibility

Since this extension hooks into the DOM API directly, you should be able to use any DOM-based UI framework, including React, Solid, Angular, Vue, Svelte, jQuery, etc.

## Enabling Your Styles

Often UI tests run without the styles that would normally be in the `<head>` of your actual application. However, this extension's UI has a menu to manually enable any additional stylesheets.

Styles are loaded using Vite's `preprocessCSS()` API, so you can use any of the following:

- CSS
- Sass
- Scss
- Stylus
- PostCSS (e.g. Tailwind)

## How It Works

- **Injects code before your test**: This extension injects a script at the beginning of your test process, which spies on mutable DOM method calls, like "appendChild", "removeChild", "setAttribute", etc, using [Tinyspy](https://github.com/tinylibs/tinyspy)

  The injection point depends on your test framework:

  - Vitest:
    - Adds a `--require` argument to the Vitest command.
  - Jest:
    - Adds a `--setupFiles` argument to the Jest command (does not override the setupFiles in your Jest config).

- **Replicates the test DOM into a real DOM**: The extension then replicates those method calls and their arguments in a VSCode WebView (the side panel), which renders your UI in a real Chromium DOM. This panel only shows a **replica** of the test DOM without your UI's Javascript, so you can't interact with it using the mouse or keyboard.

## Caveats

- **Can be slow to run until your first breakpoint**: Because of the code injected at startup for watching the DOM and optionally loading your styles, your test can be slower to startup than when debugging your tests normally with other test extensions.

- **Possible de-synchronization**: The visual DOM replica gets updated incrementally as your test runs, but accurate synchronization relies on this extension's code to correctly handle every possible DOM mutation that happens in your UI. The DOM replication code is pretty thorough, even accounting for weird cases involving nested Shadow DOMs and Web Component lifecycles, but it's still possible for the visual replica to get out of sync with your actual test DOM. If this happens, you can click the panel's Refresh button to re-sync it.
