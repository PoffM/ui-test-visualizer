/*
  This file is derived from:
  https://github.com/capricorn86/happy-dom/blob/6cbcc10a1a227b36e38a7bc33203b2ae029cca95/packages/happy-dom/test/CustomElement.ts ,
  available under the MIT License.

  Original licence below:
  =======================

  MIT License

  Copyright (c) 2019 David Ortner (capricorn86)

  Permission is hereby granted, free of charge, to any person obtaining a copy
  of this software and associated documentation files (the "Software"), to deal
  in the Software without restriction, including without limitation the rights
  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
  copies of the Software, and to permit persons to whom the Software is
  furnished to do so, subject to the following conditions:

  The above copyright notice and this permission notice shall be included in all
  copies or substantial portions of the Software.

  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
  SOFTWARE.
*/

import { HTMLElement } from 'happy-dom'
import type { IShadowRoot } from 'happy-dom'

/**
 * CustomElement test class.
 */
export default class CustomElement extends HTMLElement {
  public static observedAttributesCallCount = 0
  public static shadowRootMode = 'open'
  public changedAttributes: Array<{
    name: string
    oldValue: string | null
    newValue: string | null
  }> = []

  private internalShadowRoot: IShadowRoot

  /**
   * Constructor.
   */
  constructor() {
    super()
    this.internalShadowRoot = this.attachShadow({ mode: CustomElement.shadowRootMode })

    // Test to create a node while constructing this node.
    this.ownerDocument.createElement('div')
  }

  /**
   * Returns a list of observed attributes.
   *
   * @returns Observered attributes.
   */
  public static get observedAttributes(): string[] {
    this.observedAttributesCallCount++
    return ['key1', 'key2']
  }

  /**
   * @override
   */
  public attributeChangedCallback(name: string, oldValue: string, newValue: string): void {
    this.changedAttributes.push({ name, oldValue, newValue })
  }

  /**
   * @override
   */
  public connectedCallback(): void {
    this.internalShadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    font: 14px "Lucida Grande", Helvetica, Arial, sans-serif;
                }
                span {
                    color: pink;
                }
				.propKey {
					color: yellow;
				}
            </style>
            <div>
                <span class="propKey">
                    key1 is "${this.getAttribute('key1')}" and key2 is "${this.getAttribute(
											'key2',
										)}".
                </span>
                <span class="children">${this.childNodes
									.map(
										child =>
											// @ts-expect-error tagName should exist
											`#${child.nodeType}${child.tagName || ''}${child.textContent}`,
									)
									.join(', ')}</span>
                <span><slot></slot></span>
            </div>
        `
  }
}
