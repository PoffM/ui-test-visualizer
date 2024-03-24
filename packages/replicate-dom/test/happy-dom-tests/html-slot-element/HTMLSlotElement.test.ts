/*
  This file is derived from:
  https://github.com/capricorn86/happy-dom/blob/6cbcc10a1a227b36e38a7bc33203b2ae029cca95/packages/happy-dom/test/nodes/html-slot-element/HTMLSlotElement.test.ts ,
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
import type { Document, IHTMLSlotElement, INodeList } from 'happy-dom'
import { initTestReplicaDom } from '../../test-setup'
import { serializeDomNode } from '../../../src'
import CustomElementWithNamedSlots from './CustomElementWithNamedSlots'
import CustomElementWithSlot from './CustomElementWithSlot'

describe('hTMLSlotElement', () => {
  let window: Window
  let document: Document

  let replicaWindow: Window
  let replicaDocument: Document

  let customElementWithNamedSlots: CustomElementWithNamedSlots
  let customElementWithSlot: CustomElementWithSlot

  let replicaWithNamedSlots: CustomElementWithNamedSlots
  let replicaWithSlot: CustomElementWithSlot

  beforeEach(() => {
    window = new Window()
    document = window.document

    replicaWindow = new Window()
    replicaDocument = replicaWindow.document

    initTestReplicaDom(window, replicaWindow)

    window.customElements.define('custom-element-with-named-slots', CustomElementWithNamedSlots)
    window.customElements.define('custom-element-with-slot', CustomElementWithSlot)

    customElementWithNamedSlots = (
      document.createElement('custom-element-with-named-slots')
    ) as unknown as CustomElementWithSlot
    customElementWithSlot = (
      document.createElement('custom-element-with-slot')
    ) as unknown as CustomElementWithSlot

    document.body.appendChild(customElementWithNamedSlots)
    document.body.appendChild(customElementWithSlot)

    replicaWithNamedSlots = (
      replicaDocument.querySelector('custom-element-with-named-slots')
    ) as unknown as CustomElementWithSlot
    replicaWithSlot = (
      replicaDocument.querySelector('custom-element-with-slot')
    ) as unknown as CustomElementWithSlot
  })

  afterEach(() => {
    expect(replicaDocument.body.outerHTML).toBe(document.body.outerHTML)

    const primarySerialized = serializeDomNode(document.body, window)
    const replicaSerialized = serializeDomNode(replicaDocument.body, replicaWindow)
    expect(replicaSerialized).toEqual(primarySerialized)
  })

  describe('get name()', () => {
    it('returns attribute value.', () => {
      const slot = <IHTMLSlotElement>customElementWithSlot.shadowRoot!.querySelector('slot')

      const replica = replicaWithSlot.shadowRoot!.querySelector('slot') as IHTMLSlotElement
      expect(replica.name).toBe('')
      slot.setAttribute('name', 'value')
      expect(replica.name).toBe('value')
    })
  })

  describe('set name()', () => {
    it('sets attribute value.', () => {
      const slot = <IHTMLSlotElement>customElementWithSlot.shadowRoot!.querySelector('slot')

      const replica = replicaWithSlot.shadowRoot!.querySelector('slot') as IHTMLSlotElement
      slot.name = 'value'
      expect(replica.getAttribute('name')).toBe('value')
    })
  })

  describe('assign()', () => {
    it('sets the slot\'s manually assigned nodes to an ordered set of slottables.', () => {
      const slot = <IHTMLSlotElement>customElementWithSlot.shadowRoot!.querySelector('slot')

      expect(slot.assign()).toBe(undefined)
    })
  })

  describe('assignedNodes()', () => {
    it('returns nodes appended to the custom element.', () => {
      const slot = <IHTMLSlotElement>customElementWithSlot.shadowRoot!.querySelector('slot')
      const text = document.createTextNode('text')
      const comment = document.createComment('text')
      const div = document.createElement('div')
      const span = document.createElement('span')

      customElementWithSlot.appendChild(text)
      customElementWithSlot.appendChild(comment)
      customElementWithSlot.appendChild(div)
      customElementWithSlot.appendChild(span)

      expect(slot.assignedNodes()).toEqual(customElementWithSlot.childNodes)
      expect(
        (replicaWithSlot.shadowRoot!.querySelector('slot') as unknown as HTMLSlotElement)!
          .assignedNodes().length,
      ).toEqual(4)
    })

    it('only return elements that has the proeprty "slot" set to the same value as the property "name" of the slot.', () => {
      const text = document.createTextNode('text')
      const comment = document.createComment('text')
      const div = document.createElement('div')
      const span = document.createElement('span')

      div.slot = 'slot1'
      div.id = 'div'

      customElementWithNamedSlots.appendChild(text)
      customElementWithNamedSlots.appendChild(comment)
      customElementWithNamedSlots.appendChild(div)
      customElementWithNamedSlots.appendChild(span)

      const slots = <INodeList<IHTMLSlotElement>>(
				customElementWithNamedSlots.shadowRoot!.querySelectorAll('slot')
			)

      const replicaSlots = <INodeList<IHTMLSlotElement>>(
				replicaWithNamedSlots.shadowRoot!.querySelectorAll('slot')
			)

      expect(slots[0]!.assignedNodes()).toEqual([div])
      expect(slots[1]!.assignedNodes()).toEqual([])
      // @ts-expect-error property should exist
      expect(replicaSlots[0]!.assignedNodes().map(it => it.id)).toEqual(['div'])
      expect(replicaSlots[1]!.assignedNodes()).toEqual([])
    })
  })

  describe('assignedElements()', () => {
    it('returns elements appended to the custom element.', () => {
      const slot = <IHTMLSlotElement>customElementWithSlot.shadowRoot!.querySelector('slot')
      const text = document.createTextNode('text')
      const comment = document.createComment('text')
      const div = document.createElement('div')
      const span = document.createElement('span')

      customElementWithSlot.appendChild(text)
      customElementWithSlot.appendChild(comment)
      customElementWithSlot.appendChild(div)
      customElementWithSlot.appendChild(span)

      const replicaSlot = replicaWithSlot.shadowRoot!.querySelector('slot') as IHTMLSlotElement

      expect(slot.assignedElements()).toEqual(customElementWithSlot.children)
      expect([...replicaSlot.assignedElements()].map(it => it.tagName))
			  .toEqual(['DIV', 'SPAN'])
    })

    it('only return elements that has the proeprty "slot" set to the same value as the property "name" of the slot.', () => {
      const text = document.createTextNode('text')
      const comment = document.createComment('text')
      const div = document.createElement('div')
      const span1 = document.createElement('span')
      const span2 = document.createElement('span')

      div.slot = 'slot1'
      span1.slot = 'slot1'
      span2.slot = 'slot2'

      div.id = 'div'
      span1.id = 'span1'
      span2.id = 'span2'

      customElementWithNamedSlots.appendChild(text)
      customElementWithNamedSlots.appendChild(comment)
      customElementWithNamedSlots.appendChild(div)
      customElementWithNamedSlots.appendChild(span1)
      customElementWithNamedSlots.appendChild(span2)

      const slots = <INodeList<IHTMLSlotElement>>(
				customElementWithNamedSlots.shadowRoot!.querySelectorAll('slot')
			)

      const replicaSlots = <INodeList<IHTMLSlotElement>>replicaWithNamedSlots.shadowRoot!.querySelectorAll('slot')

      expect(slots[0]!.assignedElements()).toEqual([div, span1])
      expect(slots[1]!.assignedElements()).toEqual([span2])
      expect([...replicaSlots[0]!.assignedElements()].map(it => it.id)).toEqual(['div', 'span1'])
      expect([...replicaSlots[1]!.assignedElements()].map(it => it.id)).toEqual(['span2'])
    })
  })
})
