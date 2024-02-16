/*
  This file is derived from:
  https://github.com/capricorn86/happy-dom/blob/6cbcc10a1a227b36e38a7bc33203b2ae029cca95/packages/happy-dom/test/nodes/html-meta-element/HTMLMetaElement.test.ts ,
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
import type { IDocument, IHTMLMetaElement, IWindow } from 'happy-dom'
import { addTestElement, initTestReplicaDom } from '../../test-setup'

describe('hTMLMetaElement', () => {
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
  })

  function testElement(type: string) {
    return addTestElement<IHTMLMetaElement>(
      document,
      replicaDocument,
      type,
      'createElement',
    )
  }

  describe('object.prototype.toString', () => {
    it('returns `[object HTMLMetaElement]`', () => {
      const { replica } = testElement('meta')
      expect(Object.prototype.toString.call(replica)).toBe('[object HTMLMetaElement]')
    })
  })

  describe('get content()', () => {
    it('returns attribute value.', () => {
      const { primary, replica } = testElement('meta')
      expect(replica.content).toBe('')
      primary.setAttribute('content', 'value')
      expect(replica.content).toBe('value')
    })
  })

  describe('set content()', () => {
    it('sets attribute value.', () => {
      const { primary, replica } = testElement('meta')
      primary.content = 'value'
      expect(replica.getAttribute('content')).toBe('value')
    })
  })

  describe('get httpEquiv()', () => {
    it('returns attribute value.', () => {
      const { primary, replica } = testElement('meta')
      expect(replica.httpEquiv).toBe('')
      primary.setAttribute('http-equiv', 'value')
      expect(replica.httpEquiv).toBe('value')
    })
  })

  describe('set httpEquiv()', () => {
    it('sets attribute value.', () => {
      const { primary, replica } = testElement('meta')
      primary.httpEquiv = 'value'
      expect(replica.getAttribute('http-equiv')).toBe('value')
    })
  })

  describe('get name()', () => {
    it('returns attribute value.', () => {
      const { primary, replica } = testElement('meta')
      expect(replica.name).toBe('')
      primary.setAttribute('name', 'value')
      expect(replica.name).toBe('value')
    })
  })

  describe('set name()', () => {
    it('sets attribute value.', () => {
      const { primary, replica } = testElement('meta')
      primary.name = 'value'
      expect(replica.getAttribute('name')).toBe('value')
    })
  })

  describe('get scheme()', () => {
    it('returns attribute value.', () => {
      const { primary, replica } = testElement('meta')
      expect(replica.scheme).toBe('')
      primary.setAttribute('scheme', 'value')
      expect(replica.scheme).toBe('value')
    })
  })

  describe('set scheme()', () => {
    it('sets attribute value.', () => {
      const { primary, replica } = testElement('meta')
      primary.scheme = 'value'
      expect(replica.getAttribute('scheme')).toBe('value')
    })
  })
})
