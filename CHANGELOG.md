# ui-test-visualizer

## 1.2.4

### Patch Changes

- 0c99e56: Fixed bug where form submission in a test caused the webview to go blank

## 1.2.3

### Patch Changes

- b5edadb: perf and visual tweaks
- 19a4702: The Web View now refreshes automatically when the debugger's Restart button is used.

## 1.2.2

### Patch Changes

- ef26905: Improve style picker UI
- b2c250d: Improve performance, reduce bundle size

## 1.2.1

### Patch Changes

- 654c343: Visual tweaks

## 1.2.0

### Minor Changes

- 86a40b1: Added Inspector UI

## 1.1.3

### Patch Changes

- fb6970f: Bugfix: allow package names in Jest's setupFiles
- 043a605: Fix test setup error with Jest v30 / JSDOM (`Cannot redefine property: window`)

## 1.1.2

### Patch Changes

- b7ed022: Allow updating the test file patterns (Code Lens Selector) in the configuration without having to restart VSCode

## 1.1.1

### Patch Changes

- 7a6e257: Support monorepos where the Jest config is in the root package

## 1.1.0

### Minor Changes

- 745f43f: Support tailwind v4 for the user-selected styles

### Patch Changes

- 745f43f: Dependency updates

## 1.0.6

### Patch Changes

- 7993753: Changed an 'await import(...)' to 'require(...)' to avoid the "ERR_VM_DYNAMIC_IMPORT_CALLBACK_MISSING" error
  when loading the Jest config file.

  <https://github.com/PoffM/ui-test-visualizer/issues/3>

## 1.0.5

### Patch Changes

- 937f2d0: Improve compatibility with Jest + Babel projects by using 'npx jest' instead of running jest.js directly.

## 1.0.4

### Patch Changes

- 285bde6: Improve compatibility with Next.js projects that use "next/jest"

## 1.0.3

### Patch Changes

- a7eb835: Fix some errors that could happen when loading Jest config files, and show better error messages when they do occur.

## 1.0.2

### Patch Changes

- 6c8de74: Fix config path detection on Windows

## 1.0.1

### Patch Changes

- ad21b83: Update readme, include changelog in bundle

## 1.0.0

### Major Changes

- 1074a7b: initial release
