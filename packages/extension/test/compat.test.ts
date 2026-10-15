import { once } from 'node:events'
import fs from 'node:fs/promises'
import os from 'node:os'
import { execa } from 'execa'
import path from 'pathe'
import { describe, expect, it } from 'vitest'
import type { HTMLPatch } from 'replicate-dom'
import type { Server as WsServer } from 'ws'
import { makeDebugConfig } from '../src/debug-config'
import { detectTestFramework } from '../src/framework-support/detect-test-framework'

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

  it.each([
    { version: 2, folder: 'vitest2-react-tailwind3' },
    { version: 4, folder: 'vitest4-react-tailwind4' },
    { version: 5, folder: 'vitest5-react-tailwind4' },
  ])('works with Vitest $version + React', async ({ folder }: { folder: string }) => {
    const result = await runTest(
      `${folder}/test/basic.test.tsx`,
      'simple react testing library test',
    )

    expect(result.exitCode).toBe(0)
    expect(result.report).toMatchObject({ numPassedTests: 1 })
    expect(result.connections).toBe(1)
    expect(JSON.stringify(result.patches)).toContain('Count: ')
    expect(result.patches).toEqual(expect.arrayContaining([
      expect.objectContaining({ prop: 'nodeValue', args: ['1'] }),
    ]))
  }, 30_000)

  it('selects a nested Vitest 5 test by its individual title', async () => {
    const result = await runTest(
      'vitest5-react-tailwind4/test/form-test-for-e2e.test.tsx',
      'basic usage',
    )

    expect(result.report).toMatchObject({ numPassedTests: 1 })
    expect(result.connections).toBe(1)
    expect(JSON.stringify(result.patches)).toContain('First input')
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

  async function runTest(
    testFile: string,
    testName: string,
  ) {
    const reportDirectory = await fs.mkdtemp(path.join(os.tmpdir(), 'ui-test-visualizer-'))
    const reportPath = path.join(reportDirectory, 'report.json')
    const fakeHtmlUpdaterServer = new Server({ port: 0 })
    let connections = 0
    const patches: HTMLPatch[] = []
    fakeHtmlUpdaterServer.on('connection', (client) => {
      connections++
      client.on('message', data => patches.push(JSON.parse(data.toString()) as HTMLPatch))
    })

    try {
      await once(fakeHtmlUpdaterServer, 'listening')
      const address = fakeHtmlUpdaterServer.address()
      if (!address || typeof address === 'string') {
        throw new Error('Expected the HTML updater server to listen on a TCP port')
      }
      const fwInfo = await detectTestFramework(path.join(examplesPath, testFile), 'autodetect')
      const cfg = await makeDebugConfig(
        fwInfo,
        path.join(examplesPath, testFile),
        testName,
        address.port,
        [],
      )

      const res = await execa(
        cfg.runtimeExecutable,
        [...cfg.args, ...(fwInfo.framework === 'vitest' ? ['--reporter=json', '--outputFile', reportPath] : [])],
        { env: cfg.env, stdout: ['pipe', 'inherit'], cwd: cfg.cwd, timeout: 25_000 },
      )
      const report: unknown = fwInfo.framework === 'vitest'
        ? JSON.parse(await fs.readFile(reportPath, 'utf8'))
        : undefined
      return { ...res, connections, patches, report }
    }
    finally {
      for (const client of fakeHtmlUpdaterServer.clients) {
        client.terminate()
      }
      await new Promise<void>((resolve, reject) => {
        fakeHtmlUpdaterServer.close(error => error ? reject(error) : resolve())
      })
      await fs.rm(reportDirectory, { recursive: true, force: true })
    }
  }
})
