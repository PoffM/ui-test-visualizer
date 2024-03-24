/*
  This file is derived from:
  https://github.com/capricorn86/happy-dom/blob/6cbcc10a1a227b36e38a7bc33203b2ae029cca95/packages/happy-dom/test/nodes/html-select-element/HTMLSelectElement.test.ts ,
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
import type { Event, Document, IHTMLOptionElement, IHTMLSelectElement, Window } from 'happy-dom'
import ValidityState from '../../../node_modules/happy-dom/lib/validity-state/ValidityState.js'
import { addTestElement, initTestReplicaDom } from '../../test-setup.js'
import { serializeDomNode } from '../../../src/index.js'

describe('hTMLSelectElement', () => {
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

  function testElement<T = IHTMLSelectElement>(type: string) {
    return addTestElement<T>(
      document,
      replicaDocument,
      type,
      'createElement',
    )
  }

  describe('object.prototype.toString', () => {
    it('returns `[object HTMLSelectElement]`', () => {
      const { replica } = testElement('select')
      expect(Object.prototype.toString.call(replica)).toBe('[object HTMLSelectElement]')
    })
  })

  describe('get options()', () => {
    it('reflects changes as options elements are added and removed from the DOM.', () => {
      const { primary, replica } = testElement('select')

      const option1 = <IHTMLOptionElement>document.createElement('option')
      option1.value = 'option1'
      primary.appendChild(option1)

      expect(replica.options.length).toBe(1)
      expect((<IHTMLOptionElement>replica.options[0]).value).toBe('option1')

      primary.removeChild(option1)

      const option2 = <IHTMLOptionElement>document.createElement('option')
      const option3 = <IHTMLOptionElement>document.createElement('option')
      option2.value = 'option2'
      option3.value = 'option3'
      primary.appendChild(option2)
      primary.appendChild(option3)

      expect(replica.options.length).toBe(2)
      expect((<IHTMLOptionElement>replica.options[0]).value).toBe('option2')
      expect((<IHTMLOptionElement>replica.options[1]).value).toBe('option3')
    })
  })

  describe('get value()', () => {
    it('returns the value of the first option element in the list of options in tree order that has its selectedness set to true.', () => {
      const { primary, replica } = testElement('select')
      const option1 = <IHTMLOptionElement>document.createElement('option')
      const option2 = <IHTMLOptionElement>document.createElement('option')
      option1.selected = true
      option1.value = 'option1'
      option2.value = 'option2'
      primary.appendChild(option1)
      primary.appendChild(option2)

      expect(replica.value).toBe('option1')
    })

    it('returns empty string if there are no options.', () => {
      const { replica } = testElement('select')
      expect(replica.value).toBe('')
    })

    it('returns empty string if no option is selected.', () => {
      const { primary, replica } = testElement('select')
      const option1 = <IHTMLOptionElement>document.createElement('option')
      const option2 = <IHTMLOptionElement>document.createElement('option')
      option1.value = 'option1'
      option2.value = 'option2'
      primary.appendChild(option1)
      primary.appendChild(option2)

      expect(replica.value).toBe('option1')

      primary.selectedIndex = -1

      expect(replica.value).toBe('')
    })
  })

  describe('set value()', () => {
    it('sets options.selectedIndex.', () => {
      const { primary, replica } = testElement('select')
      const option1 = <IHTMLOptionElement>document.createElement('option')
      const option2 = <IHTMLOptionElement>document.createElement('option')
      option1.value = 'option1'
      option2.value = 'option2'
      primary.appendChild(option1)
      primary.appendChild(option2)

      primary.value = 'option1'

      expect(replica.options.selectedIndex).toBe(0)
    })
  })

  for (const property of ['disabled', 'autofocus', 'required', 'multiple']) {
    describe(`get ${property}()`, () => {
      it('returns attribute value.', () => {
        const { primary, replica } = testElement('select')
        // @ts-expect-error property should exist
        expect(replica[property]).toBe(false)
        primary.setAttribute(property, '')
        // @ts-expect-error property should exist
        expect(replica[property]).toBe(true)
      })
    })

    describe(`set ${property}()`, () => {
      it('sets attribute value.', () => {
        const { primary, replica } = testElement('select')
        // @ts-expect-error property should exist
        primary[property] = true
        expect(replica.getAttribute(property)).toBe('')
      })
    })
  }

  describe(`get name()`, () => {
    it('returns attribute value.', () => {
      const { primary, replica } = testElement('select')
      expect(replica.name).toBe('')
      primary.setAttribute('name', 'value')
      expect(replica.name).toBe('value')
    })
  })

  describe(`set name()`, () => {
    it('sets attribute value.', () => {
      const { primary, replica } = testElement('select')
      primary.name = 'value'
      expect(replica.getAttribute('name')).toBe('value')
    })
  })

  describe(`get selectedIndex()`, () => {
    it('defaults to -1.', () => {
      const { replica } = testElement('select')
      expect(replica.selectedIndex).toBe(-1)
    })

    it('returns options selectedIndex.', () => {
      const { primary, replica } = testElement('select')
      primary.appendChild(document.createElement('option'))
      primary.appendChild(document.createElement('option'))

      primary.options.selectedIndex = 1
      expect(replica.selectedIndex).toBe(1)
    })

    it('returns option with "selected" attribute is defined.', () => {
      const { primary, replica } = testElement('select')
      const option1 = document.createElement('option')
      const option2 = document.createElement('option')

      option2.setAttribute('selected', '')

      primary.appendChild(option1)
      primary.appendChild(option2)

      expect(replica.selectedIndex).toBe(1)

      option1.setAttribute('selected', '')

      expect(replica.selectedIndex).toBe(0)

      option2.removeAttribute('selected')

      expect(replica.selectedIndex).toBe(0)
    })
  })

  describe(`set selectedIndex()`, () => {
    it('allows -1', () => {
      const { primary, replica } = testElement('select')
      primary.selectedIndex = -1
      expect(replica.selectedIndex).toBe(-1)
    })

    it('sets options selectedIndex.', () => {
      const { primary, replica } = testElement('select')
      primary.appendChild(document.createElement('option'))
      primary.appendChild(document.createElement('option'))

      primary.selectedIndex = 1
      expect(replica.options.selectedIndex).toBe(1)
    })

    it('ignores invalid values gracefully.', () => {
      const { primary, replica } = testElement('select')
      primary.appendChild(document.createElement('option'))
      primary.appendChild(document.createElement('option'))

      expect(replica.options.selectedIndex).toBe(0)

      primary.selectedIndex = <number>(<unknown>undefined)
      expect(replica.options.selectedIndex).toBe(0)

      primary.selectedIndex = 1000
      expect(replica.options.selectedIndex).toBe(-1)
    })
  })

  describe(`get labels()`, () => {
    it('returns associated labels', () => {
      const element = document.createElement('select') as IHTMLSelectElement
      const label1 = document.createElement('label')
      const label2 = document.createElement('label')
      const parentLabel = document.createElement('label')

      label1.setAttribute('for', 'select1')
      label2.setAttribute('for', 'select1')

      element.id = 'select1'

      parentLabel.appendChild(element)
      document.body.appendChild(label1)
      document.body.appendChild(label2)
      document.body.appendChild(parentLabel)

      const replicaSelect = replicaDocument.querySelector('select') as IHTMLSelectElement

      const labels = replicaSelect.labels

      expect(labels.length).toBe(3)
      expect(labels[0]!.getAttribute('for')).toBe('select1')
      expect(labels[1]!.getAttribute('for')).toBe('select1')
      expect(labels[2]!.getAttribute('for')).toBe(null)
    })
  })

  describe('get validity()', () => {
    it('returns an instance of ValidityState.', () => {
      const { replica } = testElement('select')
      expect(replica.validity).toBeInstanceOf(ValidityState)
    })
  })

  describe('get validationMessage()', () => {
    it('returns validation message.', () => {
      const { primary, replica } = testElement('select')
      primary.setCustomValidity('Error message')
      expect(replica.validationMessage).toBe('Error message')
    })
  })

  describe(`add()`, () => {
    it('appends options.', () => {
      const { primary, replica } = testElement('select')
      const option1 = <IHTMLOptionElement>document.createElement('option')
      option1.id = 'option1'
      const option2 = <IHTMLOptionElement>document.createElement('option')
      option2.id = 'option2'

      primary.add(option1)
      primary.add(option2)

      expect(replica.length).toBe(2)
      expect(replica.children.length).toBe(2)
      expect(replica.options.length).toBe(2)
      // @ts-expect-error property should exist
      expect(replica[0]!.id).toBe('option1')
      // @ts-expect-error property should exist
      expect(replica[1]!.id).toBe('option2')
      expect(replica.children[0]!.id).toBe('option1')
      expect(replica.children[1]!.id).toBe('option2')
      expect(replica.options[0]!.id).toBe('option1')
      expect(replica.options[1]!.id).toBe('option2')
    })

    it('appends an option before an index.', () => {
      const { primary, replica } = testElement('select')
      const option1 = <IHTMLOptionElement>document.createElement('option')
      option1.id = 'option1'
      const option2 = <IHTMLOptionElement>document.createElement('option')
      option2.id = 'option2'
      const option3 = <IHTMLOptionElement>document.createElement('option')
      option3.id = 'option3'

      primary.add(option1)
      primary.add(option2)
      primary.add(option3, 1)

      expect(replica.length).toBe(3)
      expect(replica.children.length).toBe(3)
      expect(replica.options.length).toBe(3)
      // @ts-expect-error property should exist
      expect(replica[0]!.id).toBe('option1')
      // @ts-expect-error property should exist
      expect(replica[1]!.id).toBe('option3')
      // @ts-expect-error property should exist
      expect(replica[2]!.id).toBe('option2')
      expect(replica.children[0]!.id).toBe('option1')
      expect(replica.children[1]!.id).toBe('option3')
      expect(replica.children[2]!.id).toBe('option2')
      expect(replica.options[0]!.id).toBe('option1')
      expect(replica.options[1]!.id).toBe('option3')
      expect(replica.options[2]!.id).toBe('option2')
    })

    it('appends an option before an option element.', () => {
      const { primary, replica } = testElement('select')
      const option1 = <IHTMLOptionElement>document.createElement('option')
      option1.id = 'option1'
      const option2 = <IHTMLOptionElement>document.createElement('option')
      option2.id = 'option2'
      const option3 = <IHTMLOptionElement>document.createElement('option')
      option3.id = 'option3'

      primary.add(option1)
      primary.add(option2)
      primary.add(option3, option2)

      expect(replica.length).toBe(3)
      expect(replica.children.length).toBe(3)
      expect(replica.options.length).toBe(3)
      // @ts-expect-error property should exist
      expect(replica[0]!.id).toBe('option1')
      // @ts-expect-error property should exist
      expect(replica[1]!.id).toBe('option3')
      // @ts-expect-error property should exist
      expect(replica[2]!.id).toBe('option2')
      expect(replica.children[0]!.id).toBe('option1')
      expect(replica.children[1]!.id).toBe('option3')
      expect(replica.children[2]!.id).toBe('option2')
      expect(replica.options[0]!.id).toBe('option1')
      expect(replica.options[1]!.id).toBe('option3')
      expect(replica.options[2]!.id).toBe('option2')
    })
  })

  describe(`item()`, () => {
    it('returns an option element on a specified index.', () => {
      const { primary, replica } = testElement('select')
      const option1 = <IHTMLOptionElement>document.createElement('option')
      const option2 = <IHTMLOptionElement>document.createElement('option')
      const option3 = <IHTMLOptionElement>document.createElement('option')
      option1.id = 'option1'
      option2.id = 'option2'
      option3.id = 'option3'

      primary.add(option1)
      primary.add(option2)
      primary.add(option3)

      expect(replica.length).toBe(3)
      expect(replica.options.length).toBe(3)
      expect(replica.item(0)!.id).toBe('option1')
      expect(replica.item(1)!.id).toBe('option2')
      expect(replica.item(2)!.id).toBe('option3')
      expect(replica.options.item(0)!.id).toBe('option1')
      expect(replica.options.item(1)!.id).toBe('option2')
      expect(replica.options.item(2)!.id).toBe('option3')
    })
  })

  describe(`appendChild()`, () => {
    it('adds appended option or option group elements to the HTMLOptionsCollection.', () => {
      const { primary, replica } = testElement('select')
      const option1 = <IHTMLOptionElement>document.createElement('option')
      const option2 = <IHTMLOptionElement>document.createElement('option')
      const option3 = <IHTMLOptionElement>document.createElement('option')
      option1.id = 'option1'
      option2.id = 'option2'
      option3.id = 'option3'

      primary.appendChild(option1)
      primary.appendChild(option2)
      primary.appendChild(option3)

      expect(replica.length).toBe(3)
      expect(replica.children.length).toBe(3)
      expect(replica.options.length).toBe(3)
      // @ts-expect-error property should exist
      expect(replica[0]!.id).toBe('option1')
      // @ts-expect-error property should exist
      expect(replica[1]!.id).toBe('option2')
      // @ts-expect-error property should exist
      expect(replica[2]!.id).toBe('option3')
      expect(replica.children[0]!.id).toBe('option1')
      expect(replica.children[1]!.id).toBe('option2')
      expect(replica.children[2]!.id).toBe('option3')
      expect(replica.options[0]!.id).toBe('option1')
      expect(replica.options[1]!.id).toBe('option2')
      expect(replica.options[2]!.id).toBe('option3')
      expect(replica.item(0)!.id).toBe('option1')
      expect(replica.item(1)!.id).toBe('option2')
      expect(replica.item(2)!.id).toBe('option3')
    })

    it('does not include other types of elements in the HTMLOptionsCollection.', () => {
      const { primary, replica } = testElement('select')
      const option1 = <IHTMLOptionElement>document.createElement('option')
      const option2 = <IHTMLOptionElement>document.createElement('option')
      const option3 = <IHTMLOptionElement>document.createElement('option')
      option1.id = 'option1'
      option2.id = 'option2'
      option3.id = 'option3'

      const div = <IHTMLOptionElement>document.createElement('div')

      primary.appendChild(option1)
      primary.appendChild(option2)
      primary.appendChild(div)
      primary.appendChild(option3)

      expect(replica.length).toBe(3)
      expect(replica.children.length).toBe(4)
      expect(replica.options.length).toBe(3)
      // @ts-expect-error property should exist
      expect(replica[0]!.id).toBe('option1')
      // @ts-expect-error property should exist
      expect(replica[1]!.id).toBe('option2')
      // @ts-expect-error property should exist
      expect(replica[2]!.id).toBe('option3')
      expect(replica.children[0]!.id).toBe('option1')
      expect(replica.children[1]!.id).toBe('option2')
      expect(replica.children[2]!.id).toBe('')
      expect(replica.children[3]!.id).toBe('option3')
      expect(replica.options[0]!.id).toBe('option1')
      expect(replica.options[1]!.id).toBe('option2')
      expect(replica.options[2]!.id).toBe('option3')
      expect(replica.item(0)!.id).toBe('option1')
      expect(replica.item(1)!.id).toBe('option2')
      expect(replica.item(2)!.id).toBe('option3')
    })
  })

  describe(`insertBefore()`, () => {
    it('adds inserted option or option group elements to the HTMLOptionsCollection at correct index.', () => {
      const { primary, replica } = testElement('select')
      const option1 = <IHTMLOptionElement>document.createElement('option')
      const option2 = <IHTMLOptionElement>document.createElement('option')
      const option3 = <IHTMLOptionElement>document.createElement('option')
      option1.id = 'option1'
      option2.id = 'option2'
      option3.id = 'option3'

      primary.appendChild(option1)
      primary.appendChild(option2)
      primary.insertBefore(option3, option2)

      expect(replica.length).toBe(3)
      expect(replica.children.length).toBe(3)
      expect(replica.options.length).toBe(3)
      // @ts-expect-error property should exist
      expect(replica[0]!.id).toBe('option1')
      // @ts-expect-error property should exist
      expect(replica[1]!.id).toBe('option3')
      // @ts-expect-error property should exist
      expect(replica[2]!.id).toBe('option2')
      expect(replica.children[0]!.id).toBe('option1')
      expect(replica.children[1]!.id).toBe('option3')
      expect(replica.children[2]!.id).toBe('option2')
      expect(replica.options[0]!.id).toBe('option1')
      expect(replica.options[1]!.id).toBe('option3')
      expect(replica.options[2]!.id).toBe('option2')
      expect(replica.item(0)!.id).toBe('option1')
      expect(replica.item(1)!.id).toBe('option3')
      expect(replica.item(2)!.id).toBe('option2')
    })

    it('appends inserted option or option group elements to the HTMLOptionsCollection if referenceNode is null.', () => {
      const { primary, replica } = testElement('select')
      const option1 = <IHTMLOptionElement>document.createElement('option')
      const option2 = <IHTMLOptionElement>document.createElement('option')
      const option3 = <IHTMLOptionElement>document.createElement('option')
      option1.id = 'option1'
      option2.id = 'option2'
      option3.id = 'option3'

      primary.appendChild(option1)
      primary.appendChild(option2)
      primary.insertBefore(option3, null)

      expect(replica.length).toBe(3)
      expect(replica.children.length).toBe(3)
      expect(replica.options.length).toBe(3)
      // @ts-expect-error property should exist
      expect(replica[0]!.id).toBe('option1')
      // @ts-expect-error property should exist
      expect(replica[1]!.id).toBe('option2')
      // @ts-expect-error property should exist
      expect(replica[2]!.id).toBe('option3')
      expect(replica.children[0]!.id).toBe('option1')
      expect(replica.children[1]!.id).toBe('option2')
      expect(replica.children[2]!.id).toBe('option3')
      expect(replica.options[0]!.id).toBe('option1')
      expect(replica.options[1]!.id).toBe('option2')
      expect(replica.options[2]!.id).toBe('option3')
      expect(replica.item(0)!.id).toBe('option1')
      expect(replica.item(1)!.id).toBe('option2')
      expect(replica.item(2)!.id).toBe('option3')
    })
  })

  describe(`removeChild()`, () => {
    it('removes an option or option group elements from the HTMLOptionsCollection.', () => {
      const { primary, replica } = testElement('select')
      const option1 = <IHTMLOptionElement>document.createElement('option')
      const option2 = <IHTMLOptionElement>document.createElement('option')
      const option3 = <IHTMLOptionElement>document.createElement('option')
      option1.id = 'option1'
      option2.id = 'option2'
      option3.id = 'option3'

      primary.appendChild(option1)
      primary.appendChild(option2)
      primary.appendChild(option3)

      primary.removeChild(option2)

      expect(replica.length).toBe(2)
      expect(replica.children.length).toBe(2)
      expect(replica.options.length).toBe(2)
      // @ts-expect-error property should exist
      expect(replica[0]!.id).toBe('option1')
      // @ts-expect-error property should exist
      expect(replica[1]!.id).toBe('option3')
      expect(replica.children[0]!.id).toBe('option1')
      expect(replica.children[1]!.id).toBe('option3')
      expect(replica.options[0]!.id).toBe('option1')
      expect(replica.options[1]!.id).toBe('option3')
      expect(replica.item(0)!.id).toBe('option1')
      expect(replica.item(1)!.id).toBe('option3')
    })
  })

  describe('setCustomValidity()', () => {
    it('returns validation message.', () => {
      const { primary, replica } = testElement('select')
      primary.setCustomValidity('Error message')
      expect(replica.validationMessage).toBe('Error message')
      primary.setCustomValidity(<string>(<unknown>null))
      expect(replica.validationMessage).toBe('null')
      primary.setCustomValidity('')
      expect(replica.validationMessage).toBe('')
    })
  })

  for (const method of ['checkValidity', 'reportValidity']) {
    describe(`${method}()`, () => {
      it('returns "true" if the field is "disabled".', () => {
        const { primary, replica } = testElement('select')
        const option1 = <IHTMLOptionElement>document.createElement('option')
        option1.value = ''
        primary.appendChild(option1)

        primary.required = true
        primary.disabled = true

        // @ts-expect-error property should exist
        expect(replica[method]()).toBe(true)
      })

      it('returns "false" if invalid.', () => {
        const { primary, replica } = testElement('select')
        const option1 = <IHTMLOptionElement>document.createElement('option')
        option1.value = ''
        primary.appendChild(option1)

        primary.required = true

        // @ts-expect-error property should exist
        expect(replica[method]()).toBe(false)
      })

      it('triggers an "invalid" event when invalid.', () => {
        const { primary } = testElement('select')
        const option1 = <IHTMLOptionElement>document.createElement('option')
        option1.value = ''
        primary.appendChild(option1)

        primary.required = true

        let dispatchedEvent: Event | null = null
        primary.addEventListener('invalid', (event: Event) => (dispatchedEvent = event))

        // @ts-expect-error property should exist
        primary[method]()

        expect((<Event>(<unknown>dispatchedEvent)).type).toBe('invalid')
      })
    })
  }
})
