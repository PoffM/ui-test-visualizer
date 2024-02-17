/*
  This file is derived from:
  https://github.com/capricorn86/happy-dom/blob/6cbcc10a1a227b36e38a7bc33203b2ae029cca95/packages/happy-dom/test/nodes/html-template-element/HTMLTemplateElement.test.ts ,
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
import { Window, XMLSerializer } from 'happy-dom'
import type { IDocument, IHTMLTemplateElement, IWindow } from 'happy-dom'
import { addTestElement, initTestReplicaDom } from '../../test-setup'
import CustomElement from '../CustomElement'

describe('hTMLTemplateElement', () => {
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

  function testElement<T = IHTMLTemplateElement>(type: string) {
    return addTestElement<T>(
      document,
      replicaDocument,
      type,
      'createElement',
    )
  }

  describe('object.prototype.toString', () => {
    it('returns `[object HTMLTemplateElement]`', () => {
      const { replica } = testElement('template')
      expect(Object.prototype.toString.call(replica)).toBe('[object HTMLTemplateElement]')
    })
  })

  describe('get innerHTML()', () => {
    it('returns inner HTML of the "content" node.', () => {
      const { primary, replica } = testElement('template')

      const div = document.createElement('div')

      div.innerHTML = 'Test'

      expect(replica.content.childNodes.length).toBe(0)
      expect(replica.innerHTML).toBe('')

      primary.appendChild(div)

      expect(replica.childNodes.length).toBe(0)
      expect(replica.innerHTML).toBe('<div>Test</div>')
      expect(new XMLSerializer().serializeToString(replica.content)).toBe('<div>Test</div>')

      primary.removeChild(div)

      expect(replica.content.childNodes.length).toBe(0)
      expect(replica.innerHTML).toBe('')
    })
  })

  describe('set innerHTML()', () => {
    it('serializes the HTML into nodes and appends them to the "content" node.', () => {
      const { primary, replica } = testElement('template')

      expect(replica.content.childNodes.length).toBe(0)
      expect(replica.innerHTML).toBe('')

      primary.innerHTML = '<div>Test</div>'

      expect(replica.childNodes.length).toBe(0)
      expect(replica.innerHTML).toBe('<div>Test</div>')
      expect(new XMLSerializer().serializeToString(replica.content)).toBe('<div>Test</div>')

      primary.innerHTML = ''

      expect(replica.content.childNodes.length).toBe(0)
      expect(replica.innerHTML).toBe('')
    })
  })

  describe('get outerHTML()', () => {
    it('serializes the HTML into nodes and appends them to the "content" node.', () => {
      const { primary, replica } = testElement('template')

      expect(replica.content.childNodes.length).toBe(0)
      expect(replica.innerHTML).toBe('')

      primary.innerHTML = '<div>Test</div>'

      expect(replica.childNodes.length).toBe(0)
      expect(replica.outerHTML).toBe('<template><div>Test</div></template>')

      primary.innerHTML = ''

      expect(replica.outerHTML).toBe('<template></template>')
    })
  })

  describe('set outerHTML()', () => {
    it('replaces the template with a span.', () => {
      const element = document.createElement('template') as IHTMLTemplateElement

      element.innerHTML = '<div>Test</div>'

      document.body.appendChild(element)

      expect(document.body.innerHTML).toBe('<template><div>Test</div></template>')
      expect(replicaDocument.body.innerHTML).toBe('<template><div>Test</div></template>')

      element.outerHTML = '<span>Test</span>'

      expect(document.body.innerHTML).toBe('<span>Test</span>')
      expect(replicaDocument.body.innerHTML).toBe('<span>Test</span>')
    })
  })

  describe('get firstChild()', () => {
    it('returns first child.', () => {
      const { primary, replica } = testElement('template')
      const div = document.createElement('div')
      div.id = 'div'
      const span = document.createElement('span')
      span.id = 'span'
      primary.appendChild(div)
      primary.appendChild(span)

      // @ts-expect-error property should exist
      expect(replica.firstChild!.id).toBe('div')
    })
  })

  describe('get lastChild()', () => {
    it('returns last child.', () => {
      const { primary, replica } = testElement('template')
      const div = document.createElement('div')
      div.id = 'div'

      const span = document.createElement('span')
      span.id = 'span'

      primary.appendChild(div)
      primary.appendChild(span)

      // @ts-expect-error property should exist
      expect(replica.lastChild.id).toBe('span')
    })
  })

  describe('getInnerHTML()', () => {
    it('returns inner HTML of the "content" node.', () => {
      const { primary, replica } = testElement('template')
      const div = document.createElement('div')

      div.innerHTML = 'Test'

      expect(replica.content.childNodes.length).toBe(0)
      expect(replica.getInnerHTML()).toBe('')

      primary.appendChild(div)

      expect(replica.childNodes.length).toBe(0)
      expect(replica.getInnerHTML()).toBe('<div>Test</div>')
      expect(new XMLSerializer().serializeToString(replica.content)).toBe('<div>Test</div>')

      primary.removeChild(div)

      expect(replica.content.childNodes.length).toBe(0)
      expect(replica.getInnerHTML()).toBe('')
    })

    it('returns HTML of children and shadow roots of custom elements as a concatenated string.', () => {
      window.customElements.define('custom-element', CustomElement)

      const div = document.createElement('div')
      const customElement = <CustomElement>document.createElement('custom-element')
      div.appendChild(customElement)
      document.body.appendChild(div)

      expect(
        document.body.getInnerHTML({ includeShadowRoots: true }).includes('<span class="propKey">'),
      ).toBe(true)
      expect(
        replicaDocument.body.getInnerHTML({ includeShadowRoots: true }).includes('<span class="propKey">'),
      ).toBe(true)
    })
  })

  describe('appendChild()', () => {
    it('appends a node to the "content" node.', () => {
      const { primary, replica } = testElement('template')
      const div = document.createElement('div')
      div.id = 'div'

      expect(replica.childNodes.length).toBe(0)
      expect(replica.content.childNodes.length).toBe(0)

      primary.appendChild(div)

      expect(replica.childNodes.length).toBe(0)
      expect(replica.content.childNodes.length).toBe(1)

      // @ts-expect-error property should exist
      expect(replica.content.childNodes[0]!.id).toBe('div')

      primary.removeChild(div)

      expect(replica.childNodes.length).toBe(0)
      expect(replica.content.childNodes.length).toBe(0)
    })
  })

  describe('removeChild()', () => {
    it('removes a node from the "content" node.', () => {
      const { primary, replica } = testElement('template')
      const div = document.createElement('div')

      primary.appendChild(div)

      expect(replica.childNodes.length).toBe(0)
      expect(replica.content.childNodes.length).toBe(1)

      primary.removeChild(div)

      expect(replica.childNodes.length).toBe(0)
      expect(replica.content.childNodes.length).toBe(0)
    })
  })

  describe('insertBefore()', () => {
    it('inserts a node before another node in the "content" node.', () => {
      const { primary, replica } = testElement('template')
      const div = document.createElement('div')
      const span = document.createElement('span')
      const underline = document.createElement('u')
      primary.appendChild(div)
      primary.appendChild(span)
      primary.insertBefore(underline, span)
      expect(replica.innerHTML).toBe('<div></div><u></u><span></span>')
    })
  })

  describe('replaceChild()', () => {
    it('removes a node from the "content" node.', () => {
      const { primary, replica } = testElement('template')
      const div = document.createElement('div')
      const span = document.createElement('span')
      const underline = document.createElement('u')
      const bold = document.createElement('b')
      primary.appendChild(div)
      primary.appendChild(underline)
      primary.appendChild(span)
      primary.replaceChild(bold, underline)
      expect(replica.innerHTML).toBe('<div></div><b></b><span></span>')
    })
  })

  describe('cloneNode()', () => {
    it('clones the nodes of the "content" node.', () => {
      const { primary } = testElement('template')
      primary.innerHTML = '<div></div><b></b><span></span>'
      const clone = primary.cloneNode(true)
      expect(clone.innerHTML).toBe('<div></div><b></b><span></span>')
    })
  })
})
