import { testVisualizer } from "./test-visualizer";

// @ts-expect-error easy way to inject this
globalThis.wrapDebugConfig = testVisualizer.wrapDebugConfig;
import { activate, deactivate } from "../node_modules/vitest-explorer/dist/extension";

export { activate, deactivate };
