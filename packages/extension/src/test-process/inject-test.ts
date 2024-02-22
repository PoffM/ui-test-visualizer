// Inject this code into the test process

import { log, error as logError } from 'node:console'
import { findUpSync } from 'find-up'
import { createSyncFn } from 'synckit'
import { initPrimaryDom, serializeDomNode } from 'replicate-dom'
import { z } from 'zod'
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
        return sheets
      },
    )
  }
  catch (error) {
    logError(error)
  }
}

const injectedStyles = new Set<HTMLStyleElement>()

function loadStylesIntoHead(win: Window, files: string[]) {
  const cssSheets = (() => {
    const results: (
      | { status: 'fulfilled', value: string }
      | { status: 'rejected', reason: unknown }
    )[] = files.map((file) => {
      try {
        const style = loadStylesInWorker(file)
        if (typeof style !== 'string') {
          throw new TypeError(
            `Expected a string, but got ${typeof style} when parsing file "${file}"`,
          )
        }
        return { status: 'fulfilled', value: style }
      }
      catch (error) {
        return { status: 'rejected', reason: error }
      }
    })

    const sheets: string[] = []
    for (const [idx, result] of Object.entries(results)) {
      if (result.status === 'fulfilled') {
        sheets.push(result.value)
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

  // Remove old injected styles
  for (const oldStyle of [...injectedStyles]) {
    log('Remove stylesheet: ', oldStyle)
    oldStyle.remove()
    injectedStyles.delete(oldStyle)
  }

  // Add the new styles
  for (const sheet of cssSheets) {
    const style = win.document.createElement('style')
    style.type = 'text/css'
    style.textContent = sheet
    style.dataset.injected_by_visual_ui_test_debugger = 'true'

    // Add the new styles
    win.document.head.appendChild(style)
    injectedStyles.add(style)
    log('Inject stylesheet: ', style)
  }

  return cssSheets
}

const loadStylesInWorker = createSyncFn(require.resolve('./load-styles'))

// For when this file is "--require"d before the Vitest tests: Run immediately.
if (process.env.TEST_FRAMEWORK === 'vitest') {
  preTest()
}

if (process.env.TEST_FRAMEWORK === 'jest') {
  // Require Jest version 28+
  (() => {
    const pkg = findUpSync('node_modules/jest/package.json', {
      cwd: process.env.TEST_FILE_PATH,
    })
    if (!pkg) {
      return
    }
    // eslint-disable-next-line ts/no-var-requires, ts/no-require-imports
    const jestPkg = require(pkg)
    const version = jestPkg.version

    if (!version) {
      return
    }

    const [major] = jestPkg.version.split('.')

    const majorNum = Number(major)

    if (majorNum < 28) {
      const msg = `Jest version must be 28 or higher, found ${jestPkg.version}.
When using Jest, this extension relies on support for "setupFiles" to export an async function, introduced in Jest 28.
https://github.com/jestjs/jest/releases/tag/v28.0.0-alpha.6`
      logError(msg)
      throw new Error(msg)
    }
  })()
}

// Jest runs the default async function in the setupFiles.
module.exports = preTest
