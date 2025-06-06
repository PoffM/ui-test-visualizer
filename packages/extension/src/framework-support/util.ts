export function cleanTestNameForTerminal(testName: string): string {
  return (
    testName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') // Escape regex characters
    || `""`
  )
}
