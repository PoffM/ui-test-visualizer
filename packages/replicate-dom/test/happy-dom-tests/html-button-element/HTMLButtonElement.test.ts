/*
  This file is derived from:
  https://github.com/capricorn86/happy-dom/blob/6cbcc10a1a227b36e38a7bc33203b2ae029cca95/packages/happy-dom/test/nodes/html-button-element/HTMLButtonElement.test.ts ,
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
import type { IDocument, IHTMLButtonElement, IHTMLFormElement, IWindow } from 'happy-dom'
import { addTestElement, initTestReplicaDom } from '../../test-setup'

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
  return addTestElement(
    document,
    replicaDocument,
    type,
    'createElement',
  ) as {
    primary: IHTMLButtonElement
    replica: IHTMLButtonElement
  }
}

describe('hTMLButtonElement', () => {
  describe('get value()', () => {
    it(`returns the attribute "value".`, () => {
      const { primary, replica } = testElement('button')
      primary.setAttribute('value', 'VALUE')
      expect(replica.value).toBe('VALUE')
    })
  })

  describe('set value()', () => {
    it(`sets the attribute "value".`, () => {
      const { primary, replica } = testElement('button')
      primary.value = 'VALUE'
      expect(replica.getAttribute('value')).toBe('VALUE')
    })
  })

  describe('get name()', () => {
    it(`returns the attribute "name".`, () => {
      const { primary, replica } = testElement('button')
      primary.setAttribute('name', 'VALUE')
      expect(replica.name).toBe('VALUE')
    })
  })

  describe('set name()', () => {
    it(`sets the attribute "name".`, () => {
      const { primary, replica } = testElement('button')
      primary.name = 'VALUE'
      expect(replica.getAttribute('name')).toBe('VALUE')
    })
  })

  describe(`get disabled()`, () => {
    it('returns attribute value.', () => {
      const { primary, replica } = testElement('button')
      expect(replica.disabled).toBe(false)
      primary.setAttribute('disabled', '')
      expect(replica.disabled).toBe(true)
    })
  })

  describe(`set disabled()`, () => {
    it('sets attribute value to false.', () => {
      const { primary, replica } = testElement('button')
      primary.disabled = false
      expect(replica.getAttribute('disabled')).toBe(null)
    })

    it('sets attribute value to true.', () => {
      const { primary, replica } = testElement('button')
      primary.disabled = true
      expect(replica.getAttribute('disabled')).toBe('')
    })
  })

  describe('get type()', () => {
    it(`defaults to "submit".`, () => {
      const { replica } = testElement('button')
      expect(replica.type).toBe('submit')
    })

    it(`returns the attribute "type".`, () => {
      const { primary, replica } = testElement('button')
      primary.setAttribute('type', 'menu')
      expect(replica.type).toBe('menu')
    })

    it(`sanitizes the value before returning.`, () => {
      const { primary, replica } = testElement('button')
      primary.setAttribute('type', 'reset')
      expect(replica.type).toBe('reset')

      primary.setAttribute('type', 'button')
      expect(replica.type).toBe('button')

      primary.setAttribute('type', 'submit')
      expect(replica.type).toBe('submit')

      primary.setAttribute('type', 'MeNu')
      expect(replica.type).toBe('menu')

      primary.setAttribute('type', 'foobar')
      expect(replica.type).toBe('submit')
    })
  })

  describe('set type()', () => {
    it(`sets the attribute "type" after sanitizing.`, () => {
      const { primary, replica } = testElement('button')
      primary.type = 'SuBmIt'
      expect(replica.getAttribute('type')).toBe('submit')

      primary.type = 'reset'
      expect(replica.getAttribute('type')).toBe('reset')

      primary.type = 'button'
      expect(replica.getAttribute('type')).toBe('button')

      primary.type = 'menu'
      expect(replica.getAttribute('type')).toBe('menu');

      (<null>(<unknown>primary.type)) = null
      expect(replica.getAttribute('type')).toBe('submit')
    })
  })

  describe('get formNoValidate()', () => {
    it('returns "true" if defined.', () => {
      const { primary, replica } = testElement('button')
      expect(replica.formNoValidate).toBe(false)
      primary.setAttribute('formnovalidate', '')
      expect(replica.formNoValidate).toBe(true)
    })
  })

  describe('set formNoValidate()', () => {
    it('sets attribute value.', () => {
      const { primary, replica } = testElement('button')
      primary.formNoValidate = true
      expect(replica.getAttribute('formnovalidate')).toBe('')
    })
  })

  describe(`get form()`, () => {
    it('returns parent form.', () => {
      const { primary, replica } = testElement('button')
      const form = document.appendChild(<IHTMLFormElement>document.createElement('form'))
      form.appendChild(primary)
      expect(replica.form.tagName).toBe('FORM')
      form.removeChild(primary)
      expect(replica.form).toBe(null)
    })
  })

  describe('get validationMessage()', () => {
    it('returns validation message.', () => {
      const { primary, replica } = testElement('button')
      primary.setCustomValidity('Error message')
      expect(replica.validationMessage).toBe('Error message')
    })
  })

  describe(`get labels()`, () => {
    it('returns associated labels', () => {
      const { primary, replica } = testElement('button')
      const label1 = document.createElement('label')
      const label2 = document.createElement('label')
      const parentLabel = document.appendChild(document.createElement('label'))

      label1.setAttribute('for', 'select1')
      label2.setAttribute('for', 'select1')

      primary.id = 'select1'

      parentLabel.appendChild(primary)
      document.body.appendChild(label1)
      document.body.appendChild(label2)
      document.body.appendChild(parentLabel)

      expect(replica.labels.length).toBe(3)
      expect(replica.labels[0]?.getAttribute('for')).toBe('select1')
      expect(replica.labels[1]?.getAttribute('for')).toBe('select1')
      expect(replica.labels[2]!.tagName).toBe('LABEL')
    })
  })

  describe('setCustomValidity()', () => {
    it('returns validation message.', () => {
      const { primary, replica } = testElement('button')
      primary.setCustomValidity('Error message')
      expect(replica.validationMessage).toBe('Error message')
      primary.setCustomValidity(<string>(<unknown>null))
      expect(replica.validationMessage).toBe('null')
      primary.setCustomValidity('')
      expect(replica.validationMessage).toBe('')
    })
  })
})
