/*
  This file is derived from:
  https://github.com/capricorn86/happy-dom/blob/6cbcc10a1a227b36e38a7bc33203b2ae029cca95/packages/happy-dom/test/nodes/html-label-element/HTMLLabelElement.test.ts ,
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
import type { IDocument, IHTMLLabelElement, IWindow } from 'happy-dom'
import { addTestElement, initTestReplicaDom } from '../../test-setup'
import { serializeDomNode } from '../../../src'

describe('hTMLLabelElement', () => {
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

  function testElement(type: string) {
    return addTestElement<IHTMLLabelElement>(
      document,
      replicaDocument,
      type,
      'createElement',
    )
  }

  describe('object.prototype.toString', () => {
    it('returns `[object HTMLLabelElement]`', () => {
      const { replica } = testElement('label')
      expect(Object.prototype.toString.call(replica)).toBe('[object HTMLLabelElement]')
    })
  })

  describe('get htmlFor()', () => {
    it('returns attribute value.', () => {
      const { primary, replica } = testElement('label')
      expect(replica.htmlFor).toBe('')
      primary.setAttribute('for', 'value')
      expect(replica.htmlFor).toBe('value')
    })
  })

  describe('set htmlFor()', () => {
    it('sets attribute value.', () => {
      const { primary, replica } = testElement('label')
      primary.htmlFor = 'value'
      expect(replica.getAttribute('for')).toBe('value')
    })
  })

  describe('get control()', () => {
    it('returns element controlling the label when "for" attribute has been defined.', () => {
      const label = document.appendChild(document.createElement('label')) as IHTMLLabelElement

      const input = document.createElement('input')
      input.id = 'inputId'
      label.htmlFor = 'inputId'
      document.appendChild(input)
      document.appendChild(label)

      const replicaLabel = replicaDocument.querySelector('label') as IHTMLLabelElement
      expect(replicaLabel.control.tagName).toBe('INPUT')
    })

    it('returns input appended as a child if "for" attribute is not defined.', () => {
      const label = document.appendChild(document.createElement('label')) as IHTMLLabelElement

      const input = document.createElement('input')
      label.appendChild(input)

      const replicaLabel = replicaDocument.querySelector('label') as IHTMLLabelElement
      expect(replicaLabel.control.tagName).toBe('INPUT')
    })

    it('returns a descendent input if "for" attribute is not defined.', () => {
      const label = document.appendChild(document.createElement('label')) as IHTMLLabelElement

      const input = document.createElement('input')
      const span = document.createElement('span')
      span.appendChild(input)
      label.appendChild(span)

      const replicaLabel = replicaDocument.querySelector('label') as IHTMLLabelElement
      expect(replicaLabel.control.tagName).toBe('INPUT')
    })

    it('does not return hidden inputs.', () => {
      const label = document.appendChild(document.createElement('label')) as IHTMLLabelElement

      const input = document.createElement('input')
      input.setAttribute('type', 'hidden')
      label.appendChild(input)

      const replicaLabel = replicaDocument.querySelector('label') as IHTMLLabelElement
      expect(replicaLabel.control).toBe(null)
    })
  })

  describe('get form()', () => {
    it('returns parent form element.', () => {
      const label = document.createElement('label') as IHTMLLabelElement

      const form = document.appendChild(document.createElement('form'))
      const div = document.createElement('div')
      div.appendChild(label)
      form.appendChild(div)

      const replicaLabel = replicaDocument.querySelector('label') as IHTMLLabelElement
      expect(replicaLabel.form.tagName).toBe('FORM')
    })
  })
})
