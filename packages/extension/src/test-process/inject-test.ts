// Inject this code into the test process

import { findUpSync } from 'find-up'
import { createSyncFn } from 'synckit'
import { initPrimaryDom } from 'replicate-dom'

// Importing WebSocket directly from "ws" in a Jest process throws an error because
// "ws" wrongly thinks it's in a browser environment. Import from the index.js file
// directly instead to bypass that check.
const WebSocket
  = require('../../node_modules/ws/index.js') as typeof globalThis.WebSocket

async function preTest() {
  const client = new WebSocket(
    `ws://localhost:${process.env.HTML_UPDATER_PORT}`,
  )

  // Wait for the WebSocket to connect before continuing the test setup.
  await new Promise<void>((res) => {
    client.addEventListener('open', () => res())
  })

  let testWindow: Window = globalThis.window

  function initDom() {
    initPrimaryDom({
      root: testWindow,
      ...(process.env.EXPERIMENTAL_FAST_MODE === 'true'
        ? {
            patchMode: true,
            onMutation: htmlPatch => client.send(JSON.stringify(htmlPatch)),
          }
        : {
            patchMode: false,
            onMutation: newHtml => client.send(newHtml),
          }),
    })

    loadStylesIntoHead(testWindow)
  }

  // Hook into the window which is set by happy-dom or jsdom
  Object.defineProperty(globalThis, 'window', {
    get() {
      return testWindow
    },
    set(newWindow: Window) {
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
}

function loadStylesIntoHead(win: Window) {
  const cssSheets = (() => {
    const files = JSON.parse(process.env.TEST_CSS_FILES ?? '[]') as string[]
    if (!files) {
      return []
    }

    const results: (
      | { status: 'fulfilled', value: string }
      | { status: 'rejected', reason: unknown }
    )[] = files.map((file) => {
      try {
        const style = loadStylesInWorker(file)
        return { status: 'fulfilled', value: String(style) }
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

  for (const sheet of cssSheets) {
    const style = win.document.createElement('style')
    style.type = 'text/css'
    style.innerHTML = sheet
    win.document.head.appendChild(style)
  }
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
    const jestPkg = require(pkg)
    const version = jestPkg.version

    if (!version) {
      return
    }

    const [major] = jestPkg.version.split('.')

    const majorNum = Number(major)

    if (majorNum < 28) {
      throw new Error(
        `Jest version must be 28 or higher, found ${jestPkg.version}.
When using Jest, this extension relies on support for "setupFiles" to export an async function, introduced in Jest 28.
https://github.com/jestjs/jest/releases/tag/v28.0.0-alpha.6`,
      )
    }
  })()
}

// Jest runs the default async function in the setupFiles.
module.exports = preTest
