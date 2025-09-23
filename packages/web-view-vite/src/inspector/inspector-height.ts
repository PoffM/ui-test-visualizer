import { createSignal } from 'solid-js'
import debounce from 'lodash/debounce'
import { STORAGE_KEY_INSPECTOR_IS_OPEN, openPanel, setOpenPanel } from '../App'

const STORAGE_KEY_INSPECTOR_HEIGHT = 'ui-test-visualizer.inspector-height'
const DEFAULT_HEIGHT = 300

export function createInspectorHeight() {
  // Get initial height from storage or use default
  const initialHeight = Number(localStorage.getItem(STORAGE_KEY_INSPECTOR_HEIGHT)) || DEFAULT_HEIGHT
  const [height, setHeight] = createSignal(initialHeight)

  function isOpen() {
    return openPanel() === 'inspector'
  }

  // Wrapper for setHeight that also persists to storage
  function updateHeight(newHeight: number) {
    // Clamp height between 0 and 80% of viewport height
    const clampedHeight = Math.max(50, Math.min(newHeight, window.innerHeight * 0.8))
    setHeight(clampedHeight)
    persistHeight(clampedHeight)
  }

  function toggle() {
    setOpenPanel(isOpen() ? null : 'inspector')
    localStorage.setItem(STORAGE_KEY_INSPECTOR_IS_OPEN, isOpen() ? 'true' : '')
  }

  return {
    isOpen,
    height,
    updateHeight,
    toggle,
  }
}

const persistHeight = debounce((height: number) => {
  localStorage.setItem(STORAGE_KEY_INSPECTOR_HEIGHT, height.toString())
}, 200)
