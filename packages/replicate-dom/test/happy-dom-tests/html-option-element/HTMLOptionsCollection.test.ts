/*
  This file is derived from:
  https://github.com/capricorn86/happy-dom/blob/6cbcc10a1a227b36e38a7bc33203b2ae029cca95/packages/happy-dom/test/nodes/html-option-element/HTMLOptionsCollection.test.ts ,
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
import { DOMException, Window } from 'happy-dom'
import type { HTMLOptionElement, IDocument, IHTMLOptionElement, IHTMLSelectElement, IWindow } from 'happy-dom'
import { addTestElement, initTestReplicaDom } from '../../test-setup.js'

describe('hTMLOptionsCollection', () => {
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

  function testElement(type: string) {
    return addTestElement<IHTMLSelectElement>(
      document,
      replicaDocument,
      type,
      'createElement',
    )
  }

  afterEach(() => {
    expect(replicaDocument.body.outerHTML).toBe(document.body.outerHTML)
  })

  describe('get selectedIndex()', () => {
    it('returns -1 if there are no options.', () => {
      const { replica } = testElement('select')
      expect(replica.options.selectedIndex).toBe(-1)
    })

    it('returns 0 by default.', () => {
      const { primary, replica } = testElement('select')
      const option1 = <HTMLOptionElement>document.createElement('option')
      const option2 = <HTMLOptionElement>document.createElement('option')

      option1.value = 'option1'
      option2.value = 'option2'

      primary.appendChild(option1)
      primary.appendChild(option2)

      expect(replica.options.selectedIndex).toBe(0)
    })
  })

  describe('set selectedIndex()', () => {
    it('updates option.selected', () => {
      const { primary, replica } = testElement('select')
      const option1 = <HTMLOptionElement>document.createElement('option')
      const option2 = <HTMLOptionElement>document.createElement('option')

      expect(option1.selected).toBe(false)
      expect(option2.selected).toBe(false)

      primary.appendChild(option1)
      primary.appendChild(option2)

      expect((replica.childNodes[0] as HTMLOptionElement).selected).toBe(true)
      expect((replica.childNodes[1] as HTMLOptionElement).selected).toBe(false)

      primary.options.selectedIndex = 1

      expect((replica.childNodes[0] as HTMLOptionElement).selected).toBe(false)
      expect((replica.childNodes[1] as HTMLOptionElement).selected).toBe(true)

      primary.options.selectedIndex = -1

      expect((replica.childNodes[0] as HTMLOptionElement).selected).toBe(false)
      expect((replica.childNodes[1] as HTMLOptionElement).selected).toBe(false)
    })
  })

  describe('item()', () => {
    it('returns node at index.', () => {
      const { primary, replica } = testElement('select')
      const option = document.createElement('option')
      option.id = 'option1'
      primary.appendChild(option)
      expect(replica.options.item(0).id).toBe('option1')
    })
  })

  describe('add()', () => {
    it('adds item to the collection.', () => {
      const { primary, replica } = testElement('select')
      const option = document.createElement('option')
      option.id = 'option1'
      primary.appendChild(option)
      expect(replica.options.item(0).id).toBe('option1')

      const option2 = <IHTMLOptionElement>document.createElement('option')
      option2.id = 'option2'
      primary.options.add(option2)
      expect(replica.options.item(1).id).toBe('option2')
    })

    it('throws error when before element doesnt exist.', () => {
      const { primary, replica } = testElement('select')
      const option = document.createElement('option')
      option.id = 'option1'
      primary.appendChild(option)
      expect(replica.options.item(0).id).toBe('option1')

      const option2 = <IHTMLOptionElement>document.createElement('option')
      const optionThatDoesntExist = <IHTMLOptionElement>document.createElement('option')
      expect(() => primary.options.add(option2, optionThatDoesntExist)).toThrowError(DOMException)
    })

    it('adds item to defined index.', () => {
      const { primary, replica } = testElement('select')
      const option = document.createElement('option')
      option.id = 'option1'
      primary.appendChild(option)
      expect(replica.options.item(0).id).toBe('option1')

      const option2 = <IHTMLOptionElement>document.createElement('option')
      option2.id = 'option2'
      primary.options.add(option2, 0)
      expect(replica.options.item(0).id).toBe('option2')
    })
  })

  describe('remove()', () => {
    it('removes item from collection.', () => {
      const { primary, replica } = testElement('select')
      const option = document.createElement('option')
      primary.appendChild(option)
      primary.options.remove(0)
      expect(replica.options.length).toBe(0)
    })

    it('changes selectedIndex when element removed from collection.', () => {
      const { primary, replica } = testElement('select')
      const option = document.createElement('option')
      const option2 = document.createElement('option')

      expect(replica.options.selectedIndex).toBe(-1)

      primary.appendChild(option)
      primary.appendChild(option2)

      expect(replica.options.selectedIndex).toBe(0)

      primary.options.selectedIndex = 1
      expect(replica.options.selectedIndex).toBe(1)

      primary.options.remove(1)
      expect(replica.options.selectedIndex).toBe(0)

      primary.options.remove(0)
      expect(replica.options.selectedIndex).toBe(-1)
    })
  })
})
