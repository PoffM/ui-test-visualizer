import { execa } from 'execa'
import { findUp } from 'find-up'
import getPort from 'get-port'
import path from 'pathe'
import { beforeAll, describe, expect, it } from 'vitest'
import type { Server as WsServer } from 'ws'
import { makeDebugConfig } from '../src/debug-config'

describe('tool compatibility', async () => {
  it('works with Jest + Nextjs + SWC minimal/default setup', async () => {
    expect(
      (await runTest(
        'jest-nextjs-minimal/app/counter.test.tsx',
        'app Router: Works with Client Components (React State)',
      )).exitCode,
    ).toEqual(0)
  }, 30_000)

  it('works with Jest + SWC + Nextjs + ts-node', async () => {
    expect(
      (await runTest(
        'jest-nextjs-ts-node/app/counter.test.tsx',
        'simple react testing library test',
      )).exitCode,
    ).toEqual(0)
  }, 30_000)

  it('works with Jest + SWC + Nextjs with package.json Jest config', async () => {
    expect(
      (await runTest(
        'jest-react-with-packagejson-config/test/basic.test.tsx',
        'simple react testing library test',
      )).exitCode,
    ).toEqual(0)
  }, 30_000)

  it('works with Jest + Babel + React', async () => {
    expect(
      (await runTest(
        'jest-react/test/basic.test.tsx',
        'simple react testing library test',
      )).exitCode,
    ).toEqual(0)
  }, 30_000)

  it('works with Jest + Babel + Nextjs', async () => {
    expect(
      (await runTest(
        'jest-babel-nextjs/__tests__/index.test.tsx',
        'renders a heading',
      )).exitCode,
    ).toEqual(0)
  }, 30_000)

  it('works with Vitest + React', async () => {
    expect(
      (await runTest(
        'vitest-react-tailwind4/test/basic.test.tsx',
        'renders a heading',
      )).exitCode,
    ).toEqual(0)
  }, 30_000)

  it('works with Monorepo with top-level Jest config', async () => {
    expect(
      (await runTest(
        'jest-monorepo/packages/inner-package/test/basic.test.tsx',
        'simple react testing library test',
      )).exitCode,
    ).toEqual(0)
  }, 30_000)

  it('works with Bun + React', async () => {
    expect(
      (await runTest(
        'bun-react/test/basic.test.tsx',
        'simple react testing library test',
      )).exitCode,
    ).toEqual(0)
  })

  // Avoids import errors when importing in Vitest
  // eslint-disable-next-line ts/no-var-requires, ts/no-require-imports
  const Server = require('../node_modules/ws/lib/websocket-server') as typeof WsServer

  const examplesPath = path.join(__dirname, '../../../examples')

  let htmlUpdaterPort: number
  let fakeHtmlUpdaterServer: WsServer

  beforeAll(async () => {
    // These tests require the "build-prod" folder to exist
    {
      const buildDir = await findUp(
        'build-prod',
        { cwd: examplesPath, type: 'directory' },
      )
      if (!buildDir) {
        const pnpmLock = await findUp(
          'pnpm-lock.yaml',
          { cwd: __dirname },
        )
        if (!pnpmLock) {
          throw new Error(`Could not find project root from ${__dirname}`)
        }
        console.log('These tests requires the "build-prod" folder to exist. Building it...')
        await execa({
          cwd: path.dirname(pnpmLock),
          stdout: ['pipe', 'inherit'],
        })`pnpm run build`
      }
    }

    htmlUpdaterPort = await getPort()
    fakeHtmlUpdaterServer = new Server({ port: htmlUpdaterPort })

    await new Promise((res) => {
      fakeHtmlUpdaterServer.on('listening', res)
    })
  }, 60_000)

  async function runTest(
    testFile: string,
    testName: string,
  ) {
    const cfg = await makeDebugConfig(
      path.join(examplesPath, testFile),
      testName,
      'autodetect',
      htmlUpdaterPort,
      [],
    )

    const res = await execa(
      cfg.runtimeExecutable,
      cfg.args,
      { env: cfg.env, stdout: ['pipe', 'inherit'], cwd: cfg.cwd },
    )
    return res
  }
})
