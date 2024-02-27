/*
  This file is derived from:
  https://github.com/capricorn86/happy-dom/blob/6cbcc10a1a227b36e38a7bc33203b2ae029cca95/packages/happy-dom/test/nodes/html-style-element/HTMLStyleElement.test.ts ,
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
import type { IDocument, IHTMLStyleElement, IWindow } from 'happy-dom'
import { addTestElement, initTestReplicaDom } from '../../test-setup'
import { serializeDomNode } from '../../../src'

describe('hTMLStyleElement', () => {
  let window: IWindow
  let document: IDocument

  let replicaWindow: IWindow
  let replicaDocument: IDocument

  beforeEach(() => {
    window = new Window()
    document = window.document

    replicaWindow = new Window()
    replicaDocument = replicaWindow.document

    initTestReplicaDom(window, replicaWindow)
  })

  afterEach(() => {
    expect(replicaDocument.body.outerHTML).toBe(document.body.outerHTML)

    const primarySerialized = serializeDomNode(document.body, window)
    const replicaSerialized = serializeDomNode(replicaDocument.body, replicaWindow)
    expect(replicaSerialized).toEqual(primarySerialized)
  })

  function testElement<T = IHTMLStyleElement>(type: string) {
    return addTestElement<T>(
      document,
      replicaDocument,
      type,
      'createElement',
    )
  }

  describe('object.prototype.toString', () => {
    it('returns `[object HTMLStyleElement]`', () => {
      const { replica } = testElement('style')
      expect(Object.prototype.toString.call(replica)).toBe('[object HTMLStyleElement]')
    })
  })

  for (const property of ['media', 'type']) {
    describe(`get ${property}()`, () => {
      it(`returns the "`, () => {
        const { primary, replica } = testElement('style')
        primary.setAttribute(property, 'test')
        // @ts-expect-error property should exist
        expect(replica[property]).toBe('test')
      })
    })

    describe(`set ${property}()`, () => {
      it(`sets the attribute "`, () => {
        const { primary, replica } = testElement('style')
        // @ts-expect-error property should exist
        primary[property] = 'test'
        expect(replica.getAttribute(property)).toBe('test')
      })
    })
  }

  describe(`get disabled()`, () => {
    it('returns attribute value.', () => {
      const { primary, replica } = testElement('style')
      expect(replica.disabled).toBe(false)
      primary.setAttribute('disabled', '')
      expect(replica.disabled).toBe(true)
    })
  })

  describe(`set disabled()`, () => {
    it('sets attribute value.', () => {
      const { primary, replica } = testElement('style')
      primary.disabled = true
      expect(replica.getAttribute('disabled')).toBe('')
    })
  })

  describe(`get sheet()`, () => {
    it('returns "null" if not connected to DOM.', () => {
      const element = document.createElement('style') as IHTMLStyleElement
      expect(element.sheet).toBe(null)
    })

    it('returns an CSSStyleSheet instance with its text content as style rules.', () => {
      const element = document.createElement('style') as IHTMLStyleElement

      const textNode = document.createTextNode(
        'body { background-color: red }\ndiv { background-color: green }',
      )

      element.appendChild(textNode)
      document.head.appendChild(element)

      const replica = replicaDocument.querySelector('style') as IHTMLStyleElement

      expect(replica.sheet.cssRules.length).toBe(2)
      expect(replica.sheet.cssRules[0]!.cssText).toBe('body { background-color: red; }')
      expect(replica.sheet.cssRules[1]!.cssText).toBe('div { background-color: green; }')

      element.sheet.insertRule('html { background-color: blue }', 0)

      expect(replica.sheet.cssRules.length).toBe(3)
      expect(replica.sheet.cssRules[0]!.cssText).toBe('html { background-color: blue; }')
      expect(replica.sheet.cssRules[1]!.cssText).toBe('body { background-color: red; }')
      expect(replica.sheet.cssRules[2]!.cssText).toBe('div { background-color: green; }')
    })
  })
})
