import { createSignal } from 'solid-js'

const STORAGE_KEY_INSPECTOR_HEIGHT = 'ui-test-visualizer.inspector-height'
const STORAGE_KEY_INSPECTOR_IS_OPEN = 'ui-test-visualizer.inspector-is-open'
const DEFAULT_HEIGHT = 300

export function createInspectorHeight() {
  const initialIsOpen = Boolean(localStorage.getItem(STORAGE_KEY_INSPECTOR_IS_OPEN))
  const [isOpen, setIsOpen] = createSignal(initialIsOpen)

  // Get initial height from storage or use default
  const initialHeight = Number(localStorage.getItem(STORAGE_KEY_INSPECTOR_HEIGHT)) || DEFAULT_HEIGHT
  const [height, setHeight] = createSignal(initialHeight)

  // Wrapper for setHeight that also persists to storage
  function updateHeight(newHeight: number) {
    // Clamp height between 0 and 80% of viewport height
    const clampedHeight = Math.max(0, Math.min(newHeight, window.innerHeight * 0.8))
    setHeight(clampedHeight)
    localStorage.setItem(STORAGE_KEY_INSPECTOR_HEIGHT, clampedHeight.toString())
  }

  function toggle() {
    setIsOpen(!isOpen())
    localStorage.setItem(STORAGE_KEY_INSPECTOR_IS_OPEN, isOpen() ? 'true' : '')
  }

  return {
    isOpen,
    height,
    setHeight: updateHeight,
    toggle,
  }
}
