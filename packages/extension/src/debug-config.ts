import path from 'pathe'
import type vscode from 'vscode'
import type { z } from 'zod/mini'
import { findUp } from 'find-up'
import type { zFrameworkSetting } from './extension'
import { detectTestFramework } from './framework-support/detect'
import { jestDebugConfig } from './framework-support/jest-support'
import { vitestDebugConfig } from './framework-support/vitest-support'
import { bunDebugConfig } from './framework-support/bun-support'

const DEBUG_NAME = 'Visually Debug UI'

export async function makeDebugConfig(
  testFile: string,
  testName: string,
  frameworkSetting: z.infer<typeof zFrameworkSetting>,
  htmlUpdaterPort: number,
  testCssFiles?: string[],
) {
  const fwInfo = await detectTestFramework(testFile, frameworkSetting)

  const pkgPath = await findUp('package.json', { cwd: testFile })
  if (!pkgPath) {
    throw new Error(`Could not find related package.json for test file ${testFile}`)
  }

  const frameworkSpecificDebugConfig = await (async () => {
    switch (fwInfo.framework) {
      case 'vitest':
        return await vitestDebugConfig(testFile, testName)
      case 'jest':
        return await jestDebugConfig(testFile, testName, fwInfo)
      case 'bun':
        return await bunDebugConfig(testFile, testName)
    }
  })()

  const debugConfig: vscode.DebugConfiguration = {
    name: DEBUG_NAME,
    request: 'launch',
    type: 'pwa-node',
    runtimeExecutable: 'npx',
    outputCapture: 'std',
    cwd: path.dirname(pkgPath),
    ...frameworkSpecificDebugConfig,
  }

  debugConfig.env = {
    ...debugConfig.env,
    TEST_FRAMEWORK: fwInfo.framework,
    TEST_FILE_PATH: testFile,
    HTML_UPDATER_PORT: String(htmlUpdaterPort),
    TEST_CSS_FILES: JSON.stringify(testCssFiles ?? []),
  }

  return debugConfig
}
