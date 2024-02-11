/*
  This file is derived from:
  https://github.com/capricorn86/happy-dom/blob/6cbcc10a1a227b36e38a7bc33203b2ae029cca95/packages/happy-dom/test/nodes/document-fragment/DocumentFragment.test.ts ,
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

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Window } from 'happy-dom'
import type { HTMLTemplateElement, IDocument, IWindow, Text } from 'happy-dom'
import { addTestElement, initTestReplicaDom } from '../../../test-setup'

describe('documentFragment', () => {
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
    return addTestElement(
      document,
      replicaDocument,
      type,
      'createDocumentFragment',
    )
  }

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('set textContent()', () => {
    it('replaces child nodes with a text node.', () => {
      const { primary, replica } = testElement('test')
      const div = document.createElement('div')
      const textNode1 = document.createTextNode('text1')
      const textNode2 = document.createTextNode('text2')

      primary.appendChild(div)
      primary.appendChild(textNode1)
      primary.appendChild(textNode2)

      primary.textContent = 'new_text'

      expect(replica.textContent).toBe('new_text')
      expect(replica.childNodes.length).toBe(1)
      expect((<Text>replica.childNodes[0]).textContent).toBe('new_text')
    })

    it('removes all child nodes if textContent is set to empty string.', () => {
      const { primary, replica } = testElement('test')
      const div = document.createElement('div')
      const textNode1 = document.createTextNode('text1')
      const textNode2 = document.createTextNode('text2')

      primary.appendChild(div)
      primary.appendChild(textNode1)
      primary.appendChild(textNode2)

      primary.textContent = ''

      expect(replica.childNodes.length).toBe(0)
    })
  })

  describe('append()', () => {
    it('inserts a set of Node objects or DOMString objects after the last child of the ParentNode. DOMString objects are inserted as equivalent Text nodes.', () => {
      const { primary, replica } = testElement('test')
      const node1 = document.createComment('test1')
      const node2 = document.createComment('test2')

      primary.append(node1, node2)
      expect(replica.childNodes.length).toBe(2)
    })
  })

  describe('prepend()', () => {
    it('inserts a set of Node objects or DOMString objects before the first child of the ParentNode. DOMString objects are inserted as equivalent Text nodes.', () => {
      const { primary, replica } = testElement('test')

      const node1 = document.createComment('test1')
      const node2 = document.createComment('test2')

      primary.prepend(node1, node2)
      expect(replica.childNodes.length).toBe(2)
    })
  })

  describe('replaceChildren()', () => {
    it('replaces the existing children of a ParentNode with a specified new set of children.', () => {
      const { primary, replica } = testElement('test')

      const node1 = document.createComment('test1')
      const node2 = document.createComment('test2')

      primary.replaceChildren(node1, node2)
      expect(replica.childNodes.length).toBe(2)
    })
  })

  describe('appendChild()', () => {
    it('updates the children property when appending an element child.', () => {
      const { primary, replica } = testElement('test')

      const div = document.createElement('div')
      const span = document.createElement('span')

      primary.appendChild(document.createComment('test'))
      primary.appendChild(div)
      primary.appendChild(document.createComment('test'))
      primary.appendChild(span)

      expect(replica.children.length).toEqual(2)
    })

    // See: https://developer.mozilla.org/en-US/docs/Web/API/DocumentFragment
    it('append the children instead of the actual element if the type is DocumentFragment.', () => {
      const frag = testElement('test')
      const template = addTestElement(
        document,
        replicaDocument,
        'template',
        'createElement',
      )

      template.primary.innerHTML = '<div>Div</div><span>Span</span>'

      const clone = (template.primary as HTMLTemplateElement).content.cloneNode(true)

      frag.primary.appendChild(clone)

      expect(frag.replica.children.map(child => child.outerHTML).join('')).toBe(
        '<div>Div</div><span>Span</span>',
      )
    })
  })

  describe('removeChild()', () => {
    it('updates the children property when removing an element child.', () => {
      const { primary, replica } = testElement('test')
      const div = document.createElement('div')
      const span = document.createElement('span')

      primary.appendChild(document.createComment('test'))
      primary.appendChild(div)
      primary.appendChild(document.createComment('test'))
      primary.appendChild(span)

      primary.removeChild(div)

      expect(replica.children.length).toEqual(1)
    })
  })

  describe('insertBefore()', () => {
    it('updates the children property when appending an element child.', () => {
      const { primary, replica } = testElement('test')

      const div1 = document.createElement('div')
      const div2 = document.createElement('div')
      const span = document.createElement('span')

      primary.appendChild(document.createComment('test'))
      primary.appendChild(div1)
      primary.appendChild(document.createComment('test'))
      primary.appendChild(span)
      primary.insertBefore(div2, div1)

      expect(replica.children.length).toEqual(3)
    })

    // See: https://developer.mozilla.org/en-US/docs/Web/API/DocumentFragment
    it('insert the children instead of the actual element before another reference Node if the type is DocumentFragment.', () => {
      const { primary, replica } = testElement('test')

      const child1 = document.createElement('span')
      const child2 = document.createElement('span')
      const template = <HTMLTemplateElement>document.createElement('template')

      template.innerHTML = '<div>Template DIV 1</div><span>Template SPAN 1</span>'

      const clone = template.content.cloneNode(true)

      primary.appendChild(child1)
      primary.appendChild(child2)

      primary.insertBefore(clone, child2)

      expect(replica.children.length).toBe(4)
      expect(replica.children.map(child => child.outerHTML).join('')).toEqual(
        '<span></span><div>Template DIV 1</div><span>Template SPAN 1</span><span></span>',
      )
    })
  })
})
