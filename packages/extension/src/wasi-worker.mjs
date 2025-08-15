/// This file is copied and adapted from the wasi-worker.mjs file at https://github.com/napi-rs/napi-rs/blob/7625570cb2f9b99234addbc6d5dca0b16f294b8d/examples/napi/wasi-worker.mjs.

import { createRequire } from 'node:module'
import { WASI } from 'node:wasi'
import { Worker, parentPort } from 'node:worker_threads'
import { parse } from 'pathe'
import { MessageHandler, getDefaultContext, instantiateNapiModuleSync } from '@napi-rs/wasm-runtime'

const require = createRequire(import.meta.url)

if (parentPort) {
  parentPort.on('message', (data) => {
    globalThis.onmessage({ data })
  })
}

Object.assign(globalThis, {
  self: globalThis,
  require,
  Worker,
  postMessage(msg) {
    if (parentPort) {
      parentPort.postMessage(msg)
    }
  },
})

const emnapiContext = getDefaultContext()

const __rootDir = parse(process.cwd()).root

const handler = new MessageHandler({
  onLoad({ wasmModule, wasmMemory }) {
    const wasi = new WASI({
      version: 'preview1',
      env: process.env,
      preopens: {
        [__rootDir]: __rootDir,
      },
    })

    return instantiateNapiModuleSync(wasmModule, {
      childThread: true,
      wasi,
      context: emnapiContext,
      overwriteImports(importObject) {
        importObject.env = {
          ...importObject.env,
          ...importObject.napi,
          ...importObject.emnapi,
          memory: wasmMemory,
        }
      },
    })
  },
})

globalThis.onmessage = function (e) {
  handler.handle(e)
}
