import type { Runtime } from 'node:inspector'
import { Session } from 'node:inspector'
import { initTRPC } from '@trpc/server'
import { z } from 'zod'
import { createHTTPServer } from '@trpc/server/adapters/standalone'

const t = initTRPC.create()

export const inspectorRouter = t.router({
  evalExpression: t.procedure
    .input(z.string())
    .query(({ input }) => evalExpression(input)),
})

export type InspectorRouter = typeof inspectorRouter

;(async function startServer() {
  const port = process.env.TEST_INSPECTOR_SERVER_PORT
  if (!port) {
    throw new Error('Missing test inspector server port env variable')
  }

  createHTTPServer({ router: inspectorRouter }).listen(Number(port))
  console.log(`Inspector server listening on port ${port}`)
})()

const session = new Session()
// @ts-expect-error method should exist
session.connectToMainThread()

type EvalReturn = Runtime.EvaluateReturnType | Error

function evalExpression(expression: string): Promise<EvalReturn> {
  return new Promise<EvalReturn>((resolve) => {
    session.post('Runtime.evaluate', { expression }, (err, evalReturn) => {
      if (err) {
        console.error(err.message, err)
        resolve(new Error(err.message))
      }
      else {
        resolve(evalReturn)
      }
    })
  })
}
