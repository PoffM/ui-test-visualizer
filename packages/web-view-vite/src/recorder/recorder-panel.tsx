import { createHighlighterCore } from '@shikijs/core'
import shikiTypescript from '@shikijs/langs/typescript'
import shikiDarkPlus from '@shikijs/themes/dark-plus'
import shikiLightPlus from '@shikijs/themes/light-plus'
import { createJavaScriptRegexEngine } from 'shiki'
import { For, Suspense, createResource } from 'solid-js'
import { recorder } from '../App'
import { MOUSE_EVENT_TYPES } from './recorder'

export function RecorderPanel() {
  const [codeHighlighter] = createResource(async () => await createHighlighterCore({
    themes: [shikiDarkPlus, shikiLightPlus],
    langs: [shikiTypescript],
    engine: createJavaScriptRegexEngine(),
  }))

  function highlightedCode(code: string) {
    const shikiTheme = document.body.classList.contains('vscode-light') ? 'light-plus' : 'dark-plus'

    const html = codeHighlighter.error
      ? null
      // codeHighlighter() triggers Suspense
      : codeHighlighter()?.codeToHtml(
        code,
        { lang: 'typescript', theme: shikiTheme },
      )

    if (!html) {
      return code
    }

    return (
      <div ref={(div) => {
        div.innerHTML = html
        // Remove shiki's default background colors from the generated elements.
        for (const el of div.querySelectorAll('pre') ?? []) {
          el.style.backgroundColor = 'transparent'
        }
        for (const el of div.querySelectorAll('code') ?? []) {
          el.style.backgroundColor = 'transparent'
        }
      }}
      />
    )
  }

  return (
    <div class="flex h-full w-full">
      <div class="w-1/2 h-full overflow-y-auto p-4 border-r border-[--vscode-panel-border]">
        <div>
          <h1 class="text-lg font-semibold mb-2">Generated Code</h1>
          <div class="text-sm flex flex-col gap-2">
            <For each={Object.entries(recorder.codeInsertions() ?? {})}>{([lineNum, code]) => (
              <div>
                <h2>Insert at line: {lineNum}</h2>
                <div class="pl-2">
                  <Suspense fallback={<div>{code}</div>}>
                    <>{highlightedCode(code.map(it => it.trim()).join('\n'))}</>
                  </Suspense>
                </div>
              </div>
            )}
            </For>
          </div>
        </div>
      </div>
      <div class="w-1/2 h-full overflow-y-auto p-4">
        <div>
          <h1 class="text-lg font-semibold mb-2">Choose Mouse Event</h1>
          <div class="flex flex-wrap gap-1">
            <For each={MOUSE_EVENT_TYPES}>{event => (
              <label class="flex items-center bg-(--vscode-list-hoverBackground) px-2 py-1 rounded cursor-pointer">
                <ui-test-visualizer-radio
                  value={event}
                  checked={recorder.mouseEvent() === event}
                  onChange={(e: any) => {
                    if (e.target.checked) {
                      recorder.setMouseEvent(e.target.value)
                    }
                  }}
                >
                  <div class="pb-[3px]">
                    {event}
                  </div>
                </ui-test-visualizer-radio>
              </label>
            )}
            </For>
          </div>
        </div>
      </div>
    </div>
  )
}
