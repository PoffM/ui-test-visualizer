import type { SupportedFramework } from './detect-test-framework'

export const SUPPORTED_TESTING_LIBRARIES = [
  '@solidjs/testing-library',
  '@testing-library/react',
  '@testing-library/dom',
] as const

export type TestingLibrary = typeof SUPPORTED_TESTING_LIBRARIES[number]

export async function detectTestLibrary(testFilePath: string): Promise<TestingLibrary | null> {
  // Lookup the test framework in node_modules
  const detectedLibrary = (() => {
    for (const testingLibrary of SUPPORTED_TESTING_LIBRARIES) {
      const resolved = (() => {
        try {
          return require.resolve(testingLibrary, { paths: [testFilePath] })
        }
        catch {
          return undefined
        }
      })()
      if (resolved) {
        return testingLibrary
      }
    }
  })() ?? null

  return detectedLibrary
}
