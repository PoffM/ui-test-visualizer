// Run this script at the beginning of the test process

import { log, error as logError } from 'node:console'
import { initPrimaryDom, serializeDomNode } from 'replicate-dom'
import { z } from 'zod'
import difference from 'lodash/difference'
import shadowCss from './shadow.css.txt'

// Importing WebSocket directly from "ws" in a Jest process throws an error because
// "ws" wrongly thinks it's in a browser environment. Import from the index.js file
// directly instead to bypass that check.
const WebSocket
  // eslint-disable-next-line ts/no-var-requires, ts/no-require-imports
  = require('../../node_modules/ws/index.js') as typeof globalThis.WebSocket

async function preTest() {
  try {
    const client = new WebSocket(
      `ws://localhost:${process.env.HTML_UPDATER_PORT}`,
    )

    // Wait for the WebSocket to connect before continuing the test setup.
    await new Promise<void>((res) => {
      client.addEventListener('open', () => res())
    })

    let testWindow: typeof window = globalThis.window

    function initDom() {
      initPrimaryDom({
        root: testWindow.document,
        onMutation: htmlPatch => client.send(JSON.stringify(htmlPatch)),
        win: globalThis.window,
      })

      const filesAsString = process.env.TEST_CSS_FILES ?? '[]'

      const files = z.array(z.string()).safeParse(
        JSON.parse(filesAsString),
      )

      if (!files.success) {
        logError(`Invalid CSS files: ${JSON.stringify(filesAsString)} ( ${JSON.stringify(files.error)} )`)
        return
      }

      // Insert the default css which supports light and dark mode
      const defaultShadowStyle = testWindow.document.createElement('style')
      defaultShadowStyle.textContent = shadowCss
      defaultShadowStyle.dataset.debug_injected = 'true'
      testWindow.document.head.appendChild(defaultShadowStyle)

      loadStylesIntoHead(
        testWindow,
        files.data,
      )
    }

    // Hook into the window which is set by happy-dom or jsdom
    Object.defineProperty(globalThis, 'window', {
      get() {
        return testWindow
      },
      set(newWindow: typeof window) {
        if (newWindow !== testWindow) {
          testWindow = newWindow
          initDom()
        }
      },
      configurable: true,
    })

    if (testWindow) {
      initDom()
    }

    // Add a global function to serialize the whole HTML document,
    // so the webview can request a refresh of the whole page.
    Reflect.set(
      globalThis,
      '__serializeHtml',
      function serializeHtml() {
        return JSON.stringify(
          serializeDomNode(testWindow.document.documentElement, testWindow),
        )
      },
    )
    // Add a global function to replace the styles,
    // so the webview can change the CSS files and reload during a debug session.
    Reflect.set(
      globalThis,
      '__replaceStyles',
      function replaceStyles(
        // 'unknown' because this function is called remotely from the panelRouter.
        files: unknown,
      ) {
        const parsed = z.array(z.string()).safeParse(files)
        if (!parsed.success) {
          const err = `Invalid CSS files: ${JSON.stringify(files)} ( ${JSON.stringify(parsed.error)} )`
          logError(err)
          throw new Error(err)
        }
        const sheets = loadStylesIntoHead(testWindow, parsed.data)
        return JSON.stringify(sheets)
      },
    )
  }
  catch (error) {
    logError(error)
  }
}

function loadStylesIntoHead(win: typeof window, files: string[]) {
  const oldStyles = [
    ...win.document.querySelectorAll(
      'head>style[data-debug_injected=true][data-debug_replaceable=true]',
    ),
  ].filter((it): it is HTMLStyleElement => it instanceof win.HTMLStyleElement)

  // Add the new styles
  const newStyles = files.map((file) => {
    // If the style is already injected then keep the existing element and return early
    const existingStyle = oldStyles.find(it =>
      it instanceof win.HTMLStyleElement
      && it.dataset.src_filepath === file,
    )
    if (existingStyle) {
      // existingStyle.textContent = sheet.css
      return existingStyle
    }

    // Add a new style
    const newStyle = win.document.createElement('style')
    newStyle.type = 'text/css'
    newStyle.dataset.src_filepath = file
    newStyle.dataset.debug_injected = 'true'
    newStyle.dataset.debug_replaceable = 'true'
    win.document.head.appendChild(newStyle)
    return newStyle
  })

  for (const oldStyle of oldStyles) {
    if (!newStyles.includes(oldStyle)) {
      oldStyle.remove()
    }
  }

  // Log the styles that were added or removed
  const added = difference(newStyles, oldStyles)
  const removed = difference(oldStyles, newStyles)
  for (const style of added) {
    log('Enabled stylesheet: ', style.dataset.src_filepath)
  }
  for (const style of removed) {
    log('Disabled stylesheet: ', style.dataset.src_filepath)
  }

  return {
    added: added.map(it => String(it.dataset.src_filepath)),
    removed: removed.map(it => String(it.dataset.src_filepath)),
  }
}

// For when this file is "--require"d before the Vitest tests: Run immediately.
if (process.env.TEST_FRAMEWORK === 'vitest') {
  preTest()
}

// Jest runs the default async function in the setupFiles.
module.exports = preTest
