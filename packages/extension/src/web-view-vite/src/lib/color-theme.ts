import { createEffect, createSignal } from 'solid-js'

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
  root: () => HTMLHtmlElement | undefined,
): [() => Theme, () => void] {
  const storedTheme
    = localStorage.getItem('visual-ui-test-debugger.theme') === 'dark'
      ? 'dark'
      : 'light'

  const initialTheme
    = storedTheme
    ?? (window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light')

  const [theme, setTheme] = createSignal<'dark' | 'light'>(
    initialTheme,
  )

  createEffect(() => {
    const _root = root()
    if (!_root) {
      return
    }
    _root.dataset.theme ||= theme()
  })

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
        setTheme(newTheme)
      }
    })
    observer.observe(_root, {
      attributes: true,
      attributeFilter: ['data-theme'],
    })
    return () => observer.disconnect()
  })

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
    () => {
      const _root = root()
      if (_root) {
        _root.dataset.theme = _root.dataset.theme === 'dark' ? 'light' : 'dark'
      }
    },
  ]
}
