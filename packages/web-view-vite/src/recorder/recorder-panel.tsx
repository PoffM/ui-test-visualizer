import { createHighlighterCore } from '@shikijs/core'
import shikiTypescript from '@shikijs/langs/typescript'
import shikiDarkPlus from '@shikijs/themes/dark-plus'
import shikiLightPlus from '@shikijs/themes/light-plus'
import X from 'lucide-solid/icons/x'
import { createJavaScriptRegexEngine } from 'shiki'
import { For, Show, Suspense, createEffect, createResource, on } from 'solid-js'
import { recorder } from '../App'

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
    <div class="h-full w-full overflow-auto px-4 py-2" ref={setupCodePanel}>
      <h1 class="text-lg font-semibold mb-2">Generated Code</h1>
      <Show when={recorder.hasPendingInputChange()}>
        <div class="text-warning-foreground mb-2">
          'change' event code generates after unfocusing the input
        </div>
      </Show>
      <div class="text-sm flex flex-col gap-2">
        <For
          fallback={(
            <div class="text-muted-foreground">
              None yet
            </div>
          )}
          each={Object.entries(recorder.codeInsertions() ?? {})}
        >{([lineNum, codeLines]) => (
          <div>
            <div class="flex items-center gap-1">
              <ui-test-visualizer-button
                appearance="icon"
                onClick={async () => {
                  await recorder.removeInsertion(Number(lineNum))
                }}
              >
                <X />
              </ui-test-visualizer-button>
              <h2>Insert at line: {lineNum}</h2>
            </div>
            <div class="pl-2">
              <For each={codeLines}>
                {([code, _requiredImports], idx) => (
                  <div class="flex items-center gap-1">
                    <ui-test-visualizer-button
                      appearance="icon"
                      onClick={async () => {
                        await recorder.removeInsertion(Number(lineNum), idx())
                      }}
                    >
                      <X />
                    </ui-test-visualizer-button>
                    <Suspense fallback={<div>{code}</div>}>
                      <>{highlightedCode(code.trim())}</>
                    </Suspense>
                  </div>
                )}
              </For>
            </div>
          </div>
        )}
        </For>
      </div>
    </div>
  )
}

/** When a new code line is added, scroll to it. */
function setupCodePanel(el: HTMLDivElement) {
  createEffect(on(recorder.codeInsertions, (current, prev) => {
    if (current && prev) {
      for (const lineNum of Object.keys(current)) {
        const currentLen = current[Number(lineNum)]?.length ?? 0
        const prevLen = prev[Number(lineNum)]?.length ?? 0
        if (currentLen > prevLen) {
          queueMicrotask(() => {
            el.scrollTop = el.scrollHeight
          })
        }
      }
    }
  }))
}
