/*
  This file is derived from:
  https://github.com/capricorn86/happy-dom/blob/6cbcc10a1a227b36e38a7bc33203b2ae029cca95/packages/happy-dom/test/nodes/html-unknown-element/HTMLUnknownElement.test.ts ,
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
import type { CustomElementRegistry, HTMLUnknownElement, IDocument, IWindow } from 'happy-dom'
import * as PropertySymbol from '../../../node_modules/happy-dom/lib/PropertySymbol.js'
import { initTestReplicaDom } from '../../test-setup'
import CustomElement from '../CustomElement'

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

describe('hTMLUnknownElement', () => {
  describe('_connectNode()', () => {
    it('waits for a custom element to be defined and replace it when it is.', () => {
      const element = <HTMLUnknownElement>document.createElement('custom-element')
      const parent = document.createElement('div')

      parent.appendChild(element)

      expect(window.customElements[PropertySymbol.callbacks]['custom-element']!.length).toBe(1)

      parent.removeChild(element)

      expect(Object.keys(window.customElements[PropertySymbol.callbacks]).length).toBe(0)

      parent.appendChild(element)

      window.customElements.define('custom-element', CustomElement)

      expect(parent.children.length).toBe(1)

      expect(parent.children[0] instanceof CustomElement).toBe(true)
      expect(parent.children[0]!.shadowRoot.children.length).toBe(0)

      document.body.appendChild(parent)

      const replicaParent = replicaDocument.querySelector('div')!
      expect(parent.children[0]!.shadowRoot.children.length).toBe(2)
      expect(replicaParent.children[0]!.shadowRoot.children.length).toBe(2)
    })

    it('copies all properties from the unknown element to the new instance.', () => {
      const element = <HTMLUnknownElement>document.createElement('custom-element')
      const child1 = document.createElement('div')
      const child2 = document.createElement('div')

      element.appendChild(child1)
      element.appendChild(child2)

      document.body.appendChild(element)

      const attribute1 = document.createAttribute('test')
      attribute1.value = 'test'
      element.attributes.setNamedItem(attribute1)

      const childNodes = element.childNodes
      const children = element.children
      const rootNode = (element[PropertySymbol.rootNode] = document.createElement('div'))
      const formNode = (element[PropertySymbol.formNode] = document.createElement('div'))
      const selectNode = (element[PropertySymbol.selectNode] = document.createElement('div'))
      const textAreaNode = (element[PropertySymbol.textAreaNode] = document.createElement('div'))
      const observers = element[PropertySymbol.observers]
      element.setAttribute('is', 'test')

      window.customElements.define('custom-element', CustomElement)

      const customElement = <CustomElement>document.body.children[0]

      expect(document.body.children.length).toBe(1)
      expect(customElement instanceof CustomElement).toBe(true)

      expect(customElement.isConnected).toBe(true)
      expect(customElement.shadowRoot?.children.length).toBe(2)

      expect(customElement.childNodes === childNodes).toBe(true)
      expect(customElement.children === children).toBe(true)
      expect(customElement[PropertySymbol.rootNode] === rootNode).toBe(true)
      expect(customElement[PropertySymbol.formNode] === formNode).toBe(true)
      expect(customElement[PropertySymbol.selectNode] === selectNode).toBe(true)
      expect(customElement[PropertySymbol.textAreaNode] === textAreaNode).toBe(true)
      expect(customElement[PropertySymbol.observers] === observers).toBe(true)
      expect(customElement.getAttribute('is')).toBe('test')
      expect(customElement.attributes.length).toBe(2)
      expect(customElement.attributes[0] === attribute1).toBe(true)
    })

    it('does nothing if the property "_callback" doesn\'t exist on Window.customElements.', () => {
      (<CustomElementRegistry>window.customElements) = <CustomElementRegistry>(<unknown>{
        get: () => undefined,
      })

      const element = <HTMLUnknownElement>document.createElement('custom-element')
      const parent = document.createElement('div')

      expect(() => {
        parent.appendChild(element)
      }).not.toThrow()
    })
  })
})
