/*
  This file is derived from:
  https://github.com/capricorn86/happy-dom/blob/6cbcc10a1a227b36e38a7bc33203b2ae029cca95/packages/happy-dom/test/nodes/html-text-area-element/HTMLTextAreaElement.test.ts ,
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
import type { Document, Event, IHTMLTextAreaElement, IText } from 'happy-dom'
import { addTestElement, initTestReplicaDom } from '../../test-setup'
import { serializeDomNode } from '../../../src'

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
  return addTestElement<IHTMLTextAreaElement>(
    document,
    replicaDocument,
    type,
    'createElement',
  )
}

describe('hTMLTextAreaElement', () => {
  describe('object.prototype.toString', () => {
    it('returns `[object HTMLTextAreaElement]`', () => {
      const { replica } = testElement('textarea')
      expect(Object.prototype.toString.call(replica)).toBe('[object HTMLTextAreaElement]')
    })
  })

  describe('get value()', () => {
    it('returns text content of the element.', () => {
      const { primary, replica } = testElement('textarea')
      primary.textContent = 'TEST_VALUE'
      expect(replica.value).toBe('TEST_VALUE')
    })

    it('returns value set using the property.', () => {
      const { primary, replica } = testElement('textarea')
      primary.value = 'TEST_VALUE'
      expect(replica.value).toBe('TEST_VALUE')
    })
  })

  describe('set value()', () => {
    it('sets a value and selection range.', () => {
      const { primary, replica } = testElement('textarea')
      primary.selectionDirection = 'forward'
      primary.textContent = 'TEST_VALUE'

      expect(replica.value).toBe('TEST_VALUE')
      expect(replica.selectionStart).toBe(10)
      expect(replica.selectionEnd).toBe(10)
      expect(replica.selectionDirection).toBe('none')

      primary.selectionDirection = 'forward';
      (<IText>primary.childNodes[0]).data = 'NEW_TEST_VALUE'
      expect(replica.selectionStart).toBe(14)
      expect(replica.selectionEnd).toBe(14)
      expect(replica.selectionDirection).toBe('none')
    })
  })

  describe('get selectionStart()', () => {
    it('returns the length of the attribute "value" if value has not been set using the property.', () => {
      const { primary, replica } = testElement('textarea')
      primary.textContent = 'TEST_VALUE'
      expect(replica.selectionStart).toBe(10)
    })

    it('returns the length of the value set using the property.', () => {
      const { primary, replica } = testElement('textarea')
      primary.textContent = 'TEST_VALUE'
      primary.selectionStart = 5
      expect(replica.selectionStart).toBe(5)
    })
  })

  describe('set selectionStart()', () => {
    it('sets the value to the length of the property "value" if it is out of range.', () => {
      const { primary, replica } = testElement('textarea')
      primary.textContent = 'TEST_VALUE'
      primary.selectionStart = 20
      expect(replica.selectionStart).toBe(10)
    })

    it('sets the property.', () => {
      const { primary, replica } = testElement('textarea')
      primary.value = 'TEST_VALUE'
      primary.selectionStart = 5
      expect(replica.selectionStart).toBe(5)
    })
  })

  describe('get selectionEnd()', () => {
    it('returns the length of the attribute "value" if value has not been set using the property.', () => {
      const { primary, replica } = testElement('textarea')
      primary.textContent = 'TEST_VALUE'
      expect(replica.selectionEnd).toBe(10)
    })

    it('returns the length of the value set using the property.', () => {
      const { primary, replica } = testElement('textarea')
      primary.textContent = 'TEST_VALUE'
      primary.selectionEnd = 5
      expect(replica.selectionEnd).toBe(5)
    })
  })

  describe('set selectionEnd()', () => {
    it('sets the value to the length of the property "value" if it is out of range.', () => {
      const { primary, replica } = testElement('textarea')
      primary.textContent = 'TEST_VALUE'
      primary.selectionEnd = 20
      expect(replica.selectionEnd).toBe(10)
    })

    it('sets the property.', () => {
      const { primary, replica } = testElement('textarea')
      primary.value = 'TEST_VALUE'
      primary.selectionEnd = 5
      expect(replica.selectionEnd).toBe(5)
    })
  })

  describe('get form()', () => {
    it('returns parent form element.', () => {
      const element = document.createElement('textarea') as IHTMLTextAreaElement
      const form = document.createElement('form')
      const div = document.createElement('div')
      div.appendChild(element)
      form.appendChild(div)

      document.body.appendChild(form)

      const replica = replicaDocument.querySelector('textarea') as IHTMLTextAreaElement
      expect(replica.form.tagName).toBe('FORM')
    })
  })

  for (const property of ['disabled', 'autofocus', 'required', 'readOnly']) {
    describe(`get ${property}()`, () => {
      it('returns attribute value.', () => {
        const { primary, replica } = testElement('textarea')
        // @ts-expect-error property should exist
        expect(replica[property]).toBe(false)
        primary.setAttribute(property, '')
        // @ts-expect-error property should exist
        expect(replica[property]).toBe(true)
      })
    })

    describe(`set ${property}()`, () => {
      it('sets attribute value.', () => {
        const { primary, replica } = testElement('textarea')
        // @ts-expect-error property should exist
        primary[property] = true
        expect(replica.getAttribute(property)).toBe('')
      })
    })
  }

  for (const property of ['name', 'autocomplete', 'cols', 'rows', 'placeholder']) {
    describe(`get ${property}()`, () => {
      it('returns attribute value.', () => {
        const { primary, replica } = testElement('textarea')
        // @ts-expect-error property should exist
        expect(replica[property]).toBe('')
        primary.setAttribute(property, 'value')
        // @ts-expect-error property should exist
        expect(replica[property]).toBe('value')
      })
    })

    describe(`set ${property}()`, () => {
      it('sets attribute value.', () => {
        const { primary, replica } = testElement('textarea')
        // @ts-expect-error property should exist
        primary[property] = 'value'
        expect(replica.getAttribute(property)).toBe('value')
      })
    })
  }

  for (const property of ['minLength', 'maxLength']) {
    describe(`get ${property}()`, () => {
      it('returns attribute value.', () => {
        const { primary, replica } = testElement('textarea')
        // @ts-expect-error property should exist
        expect(replica[property]).toBe(-1)
        primary.setAttribute(property, '50')
        // @ts-expect-error property should exist
        expect(replica[property]).toBe(50)
      })
    })

    describe(`set ${property}()`, () => {
      it('sets attribute value.', () => {
        const { primary, replica } = testElement('textarea')
        // @ts-expect-error property should exist
        primary[property] = 50
        // @ts-expect-error property should exist
        expect(replica[property]).toBe(50)
        expect(replica.getAttribute(property)).toBe('50')
      })
    })
  }

  describe('get validity()', () => {
    it('returns an instance of ValidityState.', () => {
      const { replica } = testElement('textarea')
      expect(replica.validity).toBeInstanceOf(replicaWindow.ValidityState)
    })
  })

  describe(`get labels()`, () => {
    it('returns associated labels', () => {
      const label1 = document.createElement('label')
      label1.id = 'label1'
      const label2 = document.createElement('label')
      label2.id = 'label2'
      const parentLabel = document.createElement('label')
      parentLabel.id = 'parentLabel'

      label1.setAttribute('for', 'select1')
      label2.setAttribute('for', 'select1')

      const element = document.createElement('textarea') as IHTMLTextAreaElement

      element.id = 'select1'

      parentLabel.appendChild(element)
      document.body.appendChild(label1)
      document.body.appendChild(label2)
      document.body.appendChild(parentLabel)

      const replica = replicaDocument.querySelector('textarea') as IHTMLTextAreaElement

      const labels = replica.labels

      expect(labels.length).toBe(3)
      expect(labels[0]!.id).toBe('label1')
      expect(labels[1]!.id).toBe('label2')
      expect(labels[2]!.id).toBe('parentLabel')
    })
  })

  for (const method of ['checkValidity', 'reportValidity']) {
    describe(`${method}()`, () => {
      it('returns "true" if the field is "disabled".', () => {
        const { primary, replica } = testElement('textarea')
        primary.required = true
        primary.disabled = true
        // @ts-expect-error property should exist
        expect(replica[method]()).toBe(true)
      })

      it('returns "true" if the field is "readOnly".', () => {
        const { primary, replica } = testElement('textarea')
        primary.required = true
        primary.readOnly = true
        // @ts-expect-error property should exist
        expect(replica[method]()).toBe(true)
      })

      it('returns "false" if invalid.', () => {
        const { primary, replica } = testElement('textarea')
        primary.required = true
        // @ts-expect-error property should exist
        expect(replica[method]()).toBe(false)
      })

      it('triggers an "invalid" event when invalid.', () => {
        const { primary } = testElement('textarea')
        primary.required = true
        let triggeredEvent: Event | null = null
        primary.addEventListener('invalid', (event: Event) => (triggeredEvent = event))
        // @ts-expect-error property should exist
        primary[method]()
        expect((<Event>(<unknown>triggeredEvent)).type).toBe('invalid')
      })
    })
  }

  describe('select()', () => {
    it('selects all text.', () => {
      const { primary, replica } = testElement('textarea')
      let triggeredEvent: Event | null = null
      primary.addEventListener('select', event => (triggeredEvent = event))
      primary.value = 'TEST_VALUE'
      primary.select()
      expect(replica.selectionStart).toBe(0)
      expect(replica.selectionEnd).toBe(10)
      expect(replica.selectionDirection).toBe('none')
      expect((<Event>(<unknown>triggeredEvent)).type).toBe('select')
    })
  })

  describe('setSelectionRange()', () => {
    it('sets selection range.', () => {
      const { primary, replica } = testElement('textarea')
      let triggeredEvent: Event | null = null
      primary.addEventListener('select', event => (triggeredEvent = event))
      primary.value = 'TEST_VALUE'
      primary.setSelectionRange(1, 5, 'forward')
      expect(replica.selectionStart).toBe(1)
      expect(replica.selectionEnd).toBe(5)
      expect(replica.selectionDirection).toBe('forward')
      expect((<Event>(<unknown>triggeredEvent)).type).toBe('select')
    })

    it('sets selection end to the value length if out of range.', () => {
      const { primary, replica } = testElement('textarea')
      primary.value = 'TEST_VALUE'
      primary.setSelectionRange(1, 100, 'backward')
      expect(replica.selectionStart).toBe(1)
      expect(replica.selectionEnd).toBe(10)
      expect(replica.selectionDirection).toBe('backward')
    })
  })

  describe('setRangeText()', () => {
    it('sets a range text with selection mode set to "preserve".', () => {
      const { primary, replica } = testElement('textarea')
      primary.value = 'TEST_VALUE'
      primary.setRangeText('_NEW_', 4, 5)
      expect(replica.selectionStart).toBe(14)
      expect(replica.selectionEnd).toBe(14)
      expect(replica.value).toBe('TEST_NEW_VALUE')
    })

    it('sets a range text with selection mode set to "select".', () => {
      const { primary, replica } = testElement('textarea')
      primary.value = 'TEST_VALUE'
      // @ts-expect-error should be valid enum value
      primary.setRangeText('_NEW_', 4, 5, 'select')
      expect(replica.selectionStart).toBe(4)
      expect(replica.selectionEnd).toBe(14)
      expect(replica.value).toBe('TEST_NEW_VALUE')
    })

    it('sets a range text with selection mode set to "start".', () => {
      const { primary, replica } = testElement('textarea')
      primary.value = 'TEST_VALUE'
      // @ts-expect-error should be valid enum value
      primary.setRangeText('_NEW_', 4, 5, 'start')
      expect(replica.selectionStart).toBe(4)
      expect(replica.selectionEnd).toBe(4)
      expect(replica.value).toBe('TEST_NEW_VALUE')
    })

    it('sets a range text with selection mode set to "end".', () => {
      const { primary, replica } = testElement('textarea')
      primary.value = 'TEST_VALUE'
      // @ts-expect-error should be valid enum value
      primary.setRangeText('_NEW_', 4, 5, 'end')
      expect(replica.selectionStart).toBe(14)
      expect(replica.selectionEnd).toBe(14)
      expect(replica.value).toBe('TEST_NEW_VALUE')
    })
  })

  describe('cloneNode()', () => {
    it('clones node.', () => {
      const { primary, replica } = testElement('textarea')
      primary.value = 'TEST_VALUE'
      primary.selectionStart = 4
      primary.selectionEnd = 4

      const clone = primary.cloneNode(true)

      expect(clone.value).toBe(replica.value)
      expect(clone.defaultValue).toBe(replica.defaultValue)
      expect(clone.selectionStart).toBe(replica.selectionStart)
      expect(clone.selectionEnd).toBe(replica.selectionEnd)
      expect(clone.selectionDirection).toBe(replica.selectionDirection)
    })
  })
})
