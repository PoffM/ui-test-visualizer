/*
  This file is derived from:
  https://github.com/capricorn86/happy-dom/blob/6cbcc10a1a227b36e38a7bc33203b2ae029cca95/packages/happy-dom/test/nodes/html-opt-group-element/HTMLOptGroupElement.test.ts ,
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
import type { Document, IHTMLOptGroupElement, Window } from 'happy-dom'
import { addTestElement, initTestReplicaDom } from '../../test-setup.js'
import { serializeDomNode } from '../../../src/index.js'

describe('hTMLOptGroupElement', () => {
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
  })

  afterEach(() => {
    expect(replicaDocument.body.outerHTML).toBe(document.body.outerHTML)

    const primarySerialized = serializeDomNode(document.body, window)
    const replicaSerialized = serializeDomNode(replicaDocument.body, replicaWindow)
    expect(replicaSerialized).toEqual(primarySerialized)
  })

  function testElement(type: string) {
    return addTestElement<IHTMLOptGroupElement>(
      document,
      replicaDocument,
      type,
      'createElement',
    )
  }

  describe('object.prototype.toString', () => {
    it('returns `[object HTMLOptGroupElement]`', () => {
      const { replica } = testElement('optgroup')
      expect(Object.prototype.toString.call(replica)).toBe('[object HTMLOptGroupElement]')
    })
  })

  describe(`get disabled()`, () => {
    it('returns attribute value.', () => {
      const { primary, replica } = testElement('optgroup')
      expect(replica.disabled).toBe(false)
      primary.setAttribute('disabled', '')
      expect(replica.disabled).toBe(true)
    })
  })

  describe(`set disabled()`, () => {
    it('sets attribute value.', () => {
      const { primary, replica } = testElement('optgroup')
      primary.disabled = true
      expect(replica.getAttribute('disabled')).toBe('')
    })
  })

  describe(`get label()`, () => {
    it('returns attribute value.', () => {
      const { primary, replica } = testElement('optgroup')
      expect(replica.label).toBe('')
      primary.setAttribute('label', 'value')
      expect(replica.label).toBe('value')
    })
  })

  describe(`set label()`, () => {
    it('sets attribute value.', () => {
      const { primary, replica } = testElement('optgroup')
      primary.label = 'value'
      expect(replica.getAttribute('label')).toBe('value')
    })
  })
})
