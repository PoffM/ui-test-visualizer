import ChevronDown from 'lucide-solid/icons/chevron-down'
import ChevronUp from 'lucide-solid/icons/chevron-up'
import X from 'lucide-solid/icons/x'
import Search from 'lucide-solid/icons/search'

import { Show, createEffect } from 'solid-js'
import type { DOMTree } from '../lib/inspector-dom-tree'
import { search } from './Inspector'

export function SearchToolbar(props: { tree: DOMTree }) {
  // update the search results when the tree changes
  createEffect(() => {
    search.handleSearch(search.searchQuery(), props.tree)
  })

  return (
    <div class="flex items-center gap-2 p-2">
      <ui-test-visualizer-text-field
        class="grow"
        placeholder="Find by string or selector"
        onInput={(e: Event & { currentTarget: HTMLInputElement }) => {
          search.handleSearch(e.currentTarget.value, props.tree)
        }}
        onKeyDown={(e: KeyboardEvent) => {
          if (e.key === 'Enter') {
            search.handleNext()
          }
        }}
        value={search.searchQuery()}
      >
        <span slot="start"><Search class="h-4 w-4 text-muted-foreground" /></span>
      </ui-test-visualizer-text-field>
      <div class="flex items-center gap-2">
        <ui-test-visualizer-button
          appearance="icon"
          aria-label="Previous result"
          onClick={() => search.handlePrev()}
          disabled={search.matchedNodes().length < 2}
        >
          <ChevronUp class="h-4 w-4" />
        </ui-test-visualizer-button>
        <ui-test-visualizer-button
          appearance="icon"
          aria-label="Next result"
          onClick={() => search.handleNext()}
          disabled={search.matchedNodes().length < 2}
        >
          <ChevronDown class="h-4 w-4" />
        </ui-test-visualizer-button>
        <Show when={search.matchedNodes().length > 0}>
          <span class="px-2 text-sm text-muted-foreground text-center">
            {`${search.currentNodeIndex() + 1} of ${search.matchedNodes().length}`}
          </span>
        </Show>
        <ui-test-visualizer-button
          appearance="icon"
          aria-label="Clear search"
          onClick={() => search.handleClearSearch()}
          disabled={!search.searchQuery()}
        >
          <X class="h-4 w-4" />
        </ui-test-visualizer-button>
      </div>
    </div>
  )
}
