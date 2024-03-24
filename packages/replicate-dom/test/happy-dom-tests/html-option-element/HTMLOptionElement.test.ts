/*
  This file is derived from:
  https://github.com/capricorn86/happy-dom/blob/6cbcc10a1a227b36e38a7bc33203b2ae029cca95/packages/happy-dom/test/nodes/html-option-element/HTMLOptionElement.test.ts ,
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
import type { Document, IHTMLOptionElement, IHTMLSelectElement } from 'happy-dom'
import { addTestElement, initTestReplicaDom } from '../../test-setup.js'
import { serializeDomNode } from '../../../src/index.js'

describe('hTMLOptionElement', () => {
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

  function testElement<T = IHTMLOptionElement>(type: string) {
    return addTestElement<T>(
      document,
      replicaDocument,
      type,
      'createElement',
    )
  }
  describe('object.prototype.toString', () => {
    it('returns `[object HTMLOptionElement]`', () => {
      const { replica } = testElement('option')
      expect(Object.prototype.toString.call(replica)).toBe('[object HTMLOptionElement]')
    })
  })

  describe('get value()', () => {
    it('returns the attribute "value".', () => {
      const { primary, replica } = testElement('option')
      primary.setAttribute('value', 'VALUE')
      expect(replica.value).toBe('VALUE')
    })

    it('returns the text IDL value if no attribute is present.', () => {
      const { primary, replica } = testElement('option')
      primary.removeAttribute('value')
      primary.textContent = 'TEXT VALUE'
      expect(replica.value).toBe('TEXT VALUE')
    })
  })

  describe('set value()', () => {
    it('sets the attribute "value".', () => {
      const { primary, replica } = testElement('option')
      primary.value = 'VALUE'
      expect(replica.getAttribute('value')).toBe('VALUE')
    })
  })

  describe('get disabled()', () => {
    it('returns the attribute "disabled".', () => {
      const { primary, replica } = testElement('option')
      primary.setAttribute('disabled', '')
      expect(replica.disabled).toBe(true)
    })
  })

  describe('set disabled()', () => {
    it('sets the attribute "disabled".', () => {
      const { primary, replica } = testElement('option')
      primary.disabled = true
      expect(replica.getAttribute('disabled')).toBe('')
    })
  })

  describe('get selected()', () => {
    it('returns the selected state of the option.', () => {
      const { primary: select } = testElement<IHTMLSelectElement>('select')
      const { primary: option1, replica: replicaOption1 } = testElement<IHTMLOptionElement>('option')
      const { primary: option2, replica: replicaOption2 } = testElement<IHTMLOptionElement>('option')

      expect(replicaOption1.selected).toBe(false)
      expect(option2.selected).toBe(false)

      select.appendChild(option1)
      select.appendChild(option2)

      expect(replicaOption1.selected).toBe(true)
      expect(replicaOption2.selected).toBe(false)
      expect(option1.getAttribute('selected')).toBe(null)
      expect(replicaOption2.getAttribute('selected')).toBe(null)

      select.options.selectedIndex = 1

      expect(replicaOption1.selected).toBe(false)
      expect(replicaOption2.selected).toBe(true)
      expect(replicaOption1.getAttribute('selected')).toBe(null)
      expect(replicaOption2.getAttribute('selected')).toBe(null)

      select.options.selectedIndex = -1

      expect(replicaOption1.selected).toBe(false)
      expect(replicaOption2.selected).toBe(false)
    })
  })

  describe('set selected()', () => {
    it('sets the selected state of the option.', () => {
      const { primary: select, replica: replicaSelect } = testElement<IHTMLSelectElement>('select')
      const { primary: option1, replica: replicaOption1 } = testElement<IHTMLOptionElement>('option')
      const { primary: option2, replica: replicaOption2 } = testElement<IHTMLOptionElement>('option')

      expect(replicaOption1.selected).toBe(false)
      expect(replicaOption2.selected).toBe(false)

      option1.selected = true

      expect(replicaSelect.selectedIndex).toBe(-1)

      select.appendChild(option1)
      select.appendChild(option2)

      option1.selected = true

      expect(replicaSelect.selectedIndex).toBe(0)

      option2.selected = true

      expect(replicaSelect.selectedIndex).toBe(1)

      option2.selected = false

      expect(replicaSelect.selectedIndex).toBe(0)
    })
  })
})
