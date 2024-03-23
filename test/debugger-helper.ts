import type { Page } from '@playwright/test'

export class DebuggerHelper {
  constructor(private page: Page) {}

  async activeLineNum() {
    const activeLineNum = this.page.locator('.active-line-number')
    const lineNum = Number(await activeLineNum.textContent())
    return lineNum
  }

  async debugStep() {
    const startLine = await this.activeLineNum()

    // Press the step key
    await this.page.keyboard.press('F10')

    // Wait until the active line changes
    while ((await this.activeLineNum()) <= startLine) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }
  }

  async debugContinue() {
    await this.page.keyboard.press('F5')
  }
}
