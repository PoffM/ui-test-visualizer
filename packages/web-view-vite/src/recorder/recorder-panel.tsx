import { createHighlighterCore } from '@shikijs/core'
import shikiTypescript from '@shikijs/langs/typescript'
import shikiDarkPlus from '@shikijs/themes/dark-plus'
import shikiLightPlus from '@shikijs/themes/light-plus'
import { createJavaScriptRegexEngine } from 'shiki'
import { For, Show, Suspense, createResource } from 'solid-js'
import X from 'lucide-solid/icons/x'
import Info from 'lucide-solid/icons/info'
import { recorder } from '../App'
import { Tooltip, TooltipContent, TooltipTrigger } from '../components/solid-ui/tooltip'
import { FIREEVENT_MOUSE_EVENT_TYPES, USEREVENT_MOUSE_EVENT_TYPES } from './recorder'

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
      <div class="w-1/2 h-full overflow-y-auto p-4 border-r border-[var(--vscode-panel-border)]">
        <div>
          <h1 class="text-lg font-semibold mb-2">Generated Code</h1>
          <Show when={recorder.hasPendingInputChange()}>
            <div class="text-warning-foreground mb-2">
              'change' event code generates after unfocusing the input
            </div>
          </Show>
          <div class="text-sm flex flex-col gap-2">
            <For each={Object.entries(recorder.codeInsertions() ?? {})}>{([lineNum, codeLines]) => (
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
      </div>
      <div class="w-1/2 h-full overflow-y-auto p-4">
        <div class="flex flex-col gap-3">
          <For each={[
            { eventTypes: USEREVENT_MOUSE_EVENT_TYPES, name: 'user-event', useUserEvent: true, tooltip: 'Uses @testing-library/user-event' },
            { eventTypes: FIREEVENT_MOUSE_EVENT_TYPES, name: 'fireEvent', useUserEvent: false, tooltip: 'Uses testing-library\'s fireEvent' },
          ]}
          >
            {section => (
              <div>
                <div class="flex gap-2">
                  <h1 class="text-lg font-semibold mb-1">Choose Mouse Event ({section.name})</h1>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info class="w-5 h-5 mb-1" />
                    </TooltipTrigger>
                    <TooltipContent>
                      {section.tooltip}
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div class="flex flex-wrap gap-1">
                  <For each={section.eventTypes}>{event => (
                    <label class="flex items-center bg-(--vscode-list-hoverBackground) px-2 py-1 rounded cursor-pointer">
                      <ui-test-visualizer-radio
                        value={event}
                        checked={recorder.mouseEvent() === event && recorder.useUserEvent() === section.useUserEvent}
                        onChange={(e: any) => {
                          if (e.target.checked) {
                            recorder.setMouseEvent(e.target.value)
                            recorder.setUseUserEvent(section.useUserEvent)
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
            )}
          </For>
        </div>
      </div>
    </div>
  )
}
