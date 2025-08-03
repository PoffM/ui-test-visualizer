import ChevronDown from 'lucide-solid/icons/chevron-down'
import ChevronUp from 'lucide-solid/icons/chevron-up'
import X from 'lucide-solid/icons/x'
import Search from 'lucide-solid/icons/search'

import { Show, createEffect } from 'solid-js'
import type { InspectedNode } from './inspector-dom-tree'
import { search } from './Inspector'

export function SearchToolbar(props: { tree: InspectedNode }) {
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
            if (e.shiftKey) {
              search.handlePrev()
            }
            else {
              search.handleNext()
            }
          }
        }}
        value={search.searchQuery()}
        name="inspector-search-input"
      >
        <span slot="start"><Search class="h-4 w-4 text-muted-foreground" /></span>
        <ui-test-visualizer-button
          slot="end"
          appearance="icon"
          aria-label="Clear search"
          title="Clear search"
          onClick={() => search.handleClearSearch()}
        >
          <X class="h-4 w-4" />
        </ui-test-visualizer-button>
      </ui-test-visualizer-text-field>
      <div
        class="flex items-center gap-2"
        classList={{ invisible: !search.searchQuery() }}
      >
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
        <span
          class="text-sm text-muted-foreground text-center"
          classList={{ invisible: !search.matchedNodes().length }}
        >
          {`${search.currentNodeIndex() + 1} of ${search.matchedNodes().length}`}
        </span>
      </div>
    </div>
  )
}
