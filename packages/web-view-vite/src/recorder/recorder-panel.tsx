import { For, Suspense, createResource, createSignal } from 'solid-js'
import { createHighlighterCore, createJavaScriptRegexEngine } from 'shiki'
import shikiDarkPlus from '@shikijs/themes/dark-plus'
import shikiLightPlus from '@shikijs/themes/light-plus'
import shikiTypescript from '@shikijs/langs/typescript'
import { recorder } from '../App'
import { MOUSE_EVENT_TYPES } from './recorder'

export function RecorderPanel() {
  const [codeHighlighter] = createResource(async () => await createHighlighterCore({
    themes: [shikiDarkPlus, shikiLightPlus],
    langs: [shikiTypescript],
    engine: createJavaScriptRegexEngine(),
  }))

  // TODO show the actual generated code
  const [mockGeneratedCode] = createSignal([
    'console.log(\'click on button\')',
    'console.log(\'type in input\')',
    'console.log(\'hover over element\')',
    'console.log(\'double click\')',
    'console.log(\'right click\')',
    'console.log(\'mouse down\')',
    'console.log(\'mouse up\')',
    'console.log(\'mouse enter\')',
    'console.log(\'mouse leave\')',
    'console.log(\'mouse move\')',
  ])

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
    <div class="flex h-full">
      <div class="w-1/2 p-4 border-r border-[--vscode-panel-border]">
        <div>
          <h2 class="text-lg font-semibold mb-2">Generated Code</h2>
          <pre class="text-sm">
            <For each={mockGeneratedCode()}>{code => (
              <Suspense fallback={<div>{code}</div>}>
                <>{highlightedCode(code)}</>
              </Suspense>
            )}
            </For>
          </pre>
        </div>
      </div>
      <div class="w-1/2 p-4">
        <div>
          <h2 class="text-lg font-semibold mb-2">Choose Mouse Event</h2>
          <div class="flex flex-wrap gap-1">
            <For each={MOUSE_EVENT_TYPES}>{event => (
              <label class="flex items-center bg-(--checkbox-background) px-2 py-1 rounded cursor-pointer">
                <ui-test-visualizer-radio
                  value={event}
                  checked={recorder.mouseEvent() === event}
                  onChange={(e: any) => {
                    if (e.target.checked) {
                      recorder.setMouseEvent(e.target.value)
                      console.log('changed to', e)
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
