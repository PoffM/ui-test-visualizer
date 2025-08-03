import { makeEventListener } from '@solid-primitives/event-listener'

/**
 * Returns the element for the specified x coordinate and the specified y coordinate.
 * Works like `elementFromPoint` but also looks for elements in shadow roots.
 */
export function deepElementFromPoint(root: DocumentOrShadowRoot, x: number, y: number) {
  let element = root.elementFromPoint(x, y)
  let shadowRoot: ShadowRoot | null = null

  // eslint-disable-next-line no-cond-assign
  while (element && (shadowRoot = element.shadowRoot)) {
    // Use coordinates relative to the viewport
    const nestedElement = shadowRoot.elementFromPoint(x, y)
    if (!nestedElement || nestedElement === element) {
      break
    }
    element = nestedElement
  }

  return element
}

export function makeMouseEnterAndLeaveListeners(
  element: HTMLElement,
  enterFn: () => void,
  leaveFn: () => void,
) {
  makeEventListener(element, 'mouseenter', enterFn)
  makeEventListener(element, 'mouseout', leaveFn)
  makeEventListener(element, 'mouseleave', leaveFn)
}
