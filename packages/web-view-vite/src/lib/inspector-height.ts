import { createSignal } from 'solid-js'

const STORAGE_KEY = 'ui-test-visualizer.inspector-height'
const DEFAULT_HEIGHT = 300

export function createInspectorHeight() {
  // Get initial height from storage or use default
  const initialHeight = Number(localStorage.getItem(STORAGE_KEY)) || DEFAULT_HEIGHT

  const [height, setHeight] = createSignal(initialHeight)

  // Wrapper for setHeight that also persists to storage
  function updateHeight(newHeight: number) {
    // Clamp height between 0 and 80% of viewport height
    const clampedHeight = Math.max(0, Math.min(newHeight, window.innerHeight * 0.8))
    setHeight(clampedHeight)
    localStorage.setItem(STORAGE_KEY, clampedHeight.toString())
  }

  return {
    isVisible: () => height() > 0,
    height,
    setHeight: updateHeight,
    toggle: () => updateHeight(height() > 0 ? 0 : initialHeight),
  }
}
