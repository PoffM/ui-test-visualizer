/*
  This file is derived from:
  https://github.com/capricorn86/happy-dom/blob/6cbcc10a1a227b36e38a7bc33203b2ae029cca95/packages/happy-dom/test/nodes/shadow-root/ShadowRoot.test.ts ,
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

import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { Window } from 'happy-dom'
import type { Document, HTMLElement, Window } from 'happy-dom'
import CustomElement from '../CustomElement.js'
import { addTestElement, initTestReplicaDom } from '../../test-setup.js'
import { serializeDomNode } from '../../../src/index.js'

describe('shadowRoot', () => {
  let window: Window
  let document: Document

  let replicaWindow: Window
  let replicaDocument: Document

  beforeEach(() => {
    window = new Window()
    document = window.document

    replicaWindow = new Window()
    replicaDocument = replicaWindow.document

    initTestReplicaDom(window, replicaWindow)
    window.customElements.define('custom-element', CustomElement)
  })

  afterEach(() => {
    expect(replicaDocument.body.outerHTML).toBe(document.body.outerHTML)

    const primarySerialized = serializeDomNode(document.body, window)
    const replicaSerialized = serializeDomNode(replicaDocument.body, replicaWindow)
    expect(replicaSerialized).toEqual(primarySerialized)
  })

  function testElement<T = HTMLElement>(type: string) {
    return addTestElement<T>(
      document,
      replicaDocument,
      type,
      'createElement',
    )
  }

  describe('set innerHTML()', () => {
    it('sets the innerHTML of the shadow root.', () => {
      const { primary, replica } = testElement('custom-element')

      const shadowRoot = primary.shadowRoot
      shadowRoot.innerHTML = '<div attr1="value1" attr2="value2"><span>Test</span></div>'
      expect(replica.shadowRoot.childNodes.length).toBe(1)
      expect(replica.shadowRoot.childNodes[0]!.childNodes.length).toBe(1)
      expect((<HTMLElement>replica.shadowRoot.childNodes[0]).tagName).toBe('DIV')
      expect((<HTMLElement>replica.shadowRoot.childNodes[0]!.childNodes[0]).tagName).toBe('SPAN')
    })
  })

  describe('get innerHTML()', () => {
    it('returns the innerHTML of the shadow root.', () => {
      const { primary, replica } = testElement('custom-element')
      const html = '<div attr1="value1" attr2="value2"><span>Test</span></div>'
      const shadowRoot = primary.shadowRoot
      shadowRoot.innerHTML = html
      expect(replica.shadowRoot.innerHTML).toBe(html)
    })
  })

  describe('get activeElement()', () => {
    it('returns the currently active element within the ShadowRoot.', () => {
      const customElement = document.createElement('custom-element')
      const shadowRoot = customElement.shadowRoot
      const div = <HTMLElement>document.createElement('div')
      div.id = 'div'
      const span = <HTMLElement>document.createElement('span')
      span.id = 'span'

      document.body.appendChild(customElement)

      shadowRoot.appendChild(div)
      shadowRoot.appendChild(span)

      const repliaShadow = replicaDocument.querySelector('custom-element')!.shadowRoot

      expect(repliaShadow.activeElement === null).toBe(true)

      div.focus()

      expect(repliaShadow.activeElement!.id === 'div').toBe(true)

      span.focus()

      expect(repliaShadow.activeElement!.id === 'span').toBe(true)

      span.blur()

      expect(repliaShadow.activeElement === null).toBe(true)

      document.body.appendChild(span)

      span.focus()

      expect(repliaShadow.activeElement === null).toBe(true)
    })

    it('unsets the active element when it gets disconnected.', () => {
      const customElement = document.createElement('custom-element')
      const shadowRoot = customElement.shadowRoot
      const div = <HTMLElement>document.createElement('div')
      div.id = 'div'

      document.body.appendChild(customElement)

      shadowRoot.appendChild(div)

      expect(shadowRoot.activeElement === null).toBe(true)

      div.focus()

      expect(shadowRoot.activeElement!.id === 'div').toBe(true)

      customElement.remove()

      expect(shadowRoot.activeElement === null).toBe(true)
    })
  })

  describe('toString()', () => {
    it('returns the innerHTML of the shadow root.', () => {
      const { primary, replica } = testElement('custom-element')
      const html = '<div attr1="value1" attr2="value2"><span>Test</span></div>'
      const shadowRoot = primary.shadowRoot
      shadowRoot.innerHTML = html
      expect(replica.shadowRoot.toString()).toBe(html)
    })
  })

  describe('cloneNode()', () => {
    it('clones the value of the "mode" property when cloned.', () => {
      const { primary, replica } = testElement('custom-element')
      const shadowRoot = primary.shadowRoot
      const clone = shadowRoot.cloneNode()
      expect(replica.shadowRoot.mode).toBe('open')
      expect(clone.mode).toBe('open')
    })
  })
})
