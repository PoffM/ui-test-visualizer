import { startVisualTestingBackEnd } from "./inject-extension";

// @ts-expect-error easy way to inject this into the the patched Vitest extension. 
globalThis.startVisualTestingBackend = startVisualTestingBackEnd;

// @ts-expect-error import the compiled Vitest extension with the injected code.
import { activate, deactivate } from "../../node_modules/vitest-explorer/dist/extension.js";

export { activate, deactivate };
