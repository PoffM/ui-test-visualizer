import { createEffect, from } from 'solid-js'

export type Theme = 'dark' | 'light' | 'system'

/**
 * Creates a color theme signal.
 *
 * Stores the theme in the `<html>` root node's "data-theme" and "class" attributes:
 * e.g. `<html data-theme="dark" class="dark">`.
 *
 * Saves the last selected theme in local storage.
 */
export function createColorTheme(
  root: () => HTMLElement | undefined,
): [() => Theme | undefined, () => void] {
  const theme = from<Theme>((set) => {
    createEffect(() => {
      const _root = root()
      if (!_root) {
        return
      }

      const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations.filter(
          it => it.attributeName === 'data-theme',
        )) {
          const target = mutation.target as HTMLElement
          const newTheme: Theme
            = target.dataset.theme === 'dark' ? 'dark' : 'light'
          set(newTheme)
        }
      })
      observer.observe(_root, {
        attributes: true,
        attributeFilter: ['data-theme'],
      })

      const defaultTheme = (() => {
        const storedTheme
          = localStorage.getItem('visual-ui-test-debugger.theme') === 'dark'
            ? 'dark'
            : 'light'

        const prefTheme = (window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light')

        return storedTheme ?? prefTheme
      })()

      _root.dataset.theme ||= defaultTheme

      return () => observer.disconnect()
    })

    return () => {}
  })

  // Copy the theme into the root element's class list.
  createEffect(() => {
    const _theme = theme()
    if (_theme) {
      if (!root()?.classList.contains(_theme)) {
        root()?.classList.remove('dark', 'light')
        root()?.classList.add(_theme)
      }

      localStorage.setItem('visual-ui-test-debugger.theme', _theme)
    }
  })

  return [
    () => theme(),
    function toggleTheme() {
      const _root = root()
      if (!_root) {
        return
      }
      _root.dataset.theme = _root.dataset.theme === 'dark' ? 'light' : 'dark'
    },
  ]
}
