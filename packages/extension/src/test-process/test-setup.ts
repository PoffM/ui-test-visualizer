// Run this script at the beginning of the test process

import { log, error as logError } from 'node:console'
import { createSyncFn } from 'synckit'
import { initPrimaryDom, serializeDomNode } from 'replicate-dom'
import { z } from 'zod'
import difference from 'lodash/difference'
import path from 'pathe'
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

      // Run the loadStyles worker as a 'warmup' before the test starts.
      // Otherwise, for some reason the worker fails (running Vite's preprocessCss)
      // when you run it during the user's UI test through a debug expression.
      // This would freeze the test when the user tries to change the CSS files.
      // TODO figure out why this happens, or find a better way to change the CSS files.
      try {
        loadStylesInWorker(path.join(__dirname, 'example-style.css'))
      }
      catch (error) {
      }
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
        return sheets
      },
    )
  }
  catch (error) {
    logError(error)
  }
}

function loadStylesIntoHead(win: typeof window, files: string[]) {
  const cssSheets = (() => {
    const results: ({ file: string } & (
      | { status: 'fulfilled', value: string }
      | { status: 'rejected', reason: unknown }
    ))[] = files.map((file) => {
      try {
        const style = loadStylesInWorker(file)
        if (typeof style !== 'string') {
          throw new TypeError(
            `Expected a string, but got ${typeof style} when parsing file "${file}"`,
          )
        }
        return { file, status: 'fulfilled', value: style }
      }
      catch (error) {
        logError(`Could not load CSS file "${file}" ${String(error)}`)
        return { file, status: 'rejected', reason: error }
      }
    })

    const sheets: { file: string, css: string }[] = []
    for (const [idx, result] of Object.entries(results)) {
      if (result.status === 'fulfilled') {
        sheets.push({ file: result.file, css: result.value })
      }
      if (result.status === 'rejected') {
        console.error(
          `Could not load CSS file "${files[Number(idx)]}" ${String(
            result.reason,
          )}`,
        )
      }
    }

    return sheets
  })()

  const oldStyles = [
    ...win.document.querySelectorAll(
      'head>style[data-debug_injected=true][data-debug_replaceable=true]',
    ),
  ].filter((it): it is HTMLStyleElement => it instanceof win.HTMLStyleElement)

  // Add the new styles
  const newStyles = cssSheets.map((sheet) => {
    // If the style is already injected then re-use the element
    const existingStyle = oldStyles.find(it =>
      it instanceof win.HTMLStyleElement
      && it.dataset.src_filepath === sheet.file,
    )
    if (existingStyle) {
      existingStyle.textContent = sheet.css
      return existingStyle
    }

    // Add a new style
    const newStyle = win.document.createElement('style')
    newStyle.type = 'text/css'
    newStyle.textContent = sheet.css
    newStyle.dataset.src_filepath = sheet.file
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

  return cssSheets
}

const loadStylesInWorker = createSyncFn(require.resolve('./load-styles'))

// For when this file is "--require"d before the Vitest tests: Run immediately.
if (process.env.TEST_FRAMEWORK === 'vitest') {
  preTest()
}

// Jest runs the default async function in the setupFiles.
module.exports = preTest
