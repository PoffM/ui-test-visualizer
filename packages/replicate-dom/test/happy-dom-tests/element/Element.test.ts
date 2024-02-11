/*
  This file is derived from:
  https://github.com/capricorn86/happy-dom/blob/6cbcc10a1a227b36e38a7bc33203b2ae029cca95/packages/happy-dom/test/nodes/element/Element.test.ts ,
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
import { Node, Window } from 'happy-dom'
import type { Element, HTMLTemplateElement, IAttr, IDocument, IElement, IWindow, Text } from 'happy-dom'
import { addTestElement, initTestReplicaDom } from '../../test-setup'
import CustomElement from '../CustomElement'

const NAMESPACE_URI = 'https://test.test'
const NamespaceURI = {
  html: 'http://www.w3.org/1999/xhtml',
  svg: 'http://www.w3.org/2000/svg',
  mathML: 'http://www.w3.org/1998/Math/MathML',
}

describe('element', () => {
  let window: IWindow
  let document: IDocument

  let replicaWindow: IWindow
  let replicaDocument: IDocument

  beforeEach(() => {
    window = new Window()
    document = window.document

    replicaWindow = new Window()
    replicaDocument = replicaWindow.document

    window.customElements.define('custom-element', CustomElement)

    initTestReplicaDom(window, replicaWindow)
  })

  function testElement(type: string) {
    return addTestElement(
      document,
      replicaDocument,
      type,
      'createElement',
    )
  }

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('children', () => {
    it('returns nodes of type Element.', () => {
      const { primary, replica } = testElement('div')

      const div1 = document.createElement('div')
      const div2 = document.createElement('div')
      const textNode = document.createTextNode('text')
      primary.appendChild(div1)
      primary.appendChild(textNode)
      primary.appendChild(div2)
      expect(replica.children.length).toBe(2)
    })
  })

  describe('set id()', () => {
    it('sets the element "id" as an attribute.', () => {
      const { primary, replica } = testElement('div')
      primary.id = 'id'
      expect(replica.getAttribute('id')).toBe('id')
    })
  })

  describe('set slot()', () => {
    it('sets the element "slot" as an attribute.', () => {
      const { primary, replica } = testElement('div')
      primary.slot = 'slot'
      expect(replica.getAttribute('slot')).toBe('slot')
    })
  })

  describe('set className()', () => {
    it('sets the element "class" as an attribute.', () => {
      const { primary, replica } = testElement('div')
      primary.className = 'class'
      expect(replica.getAttribute('class')).toBe('class')
    })
  })

  describe('set role()', () => {
    it('sets the element "role" as an attribute.', () => {
      const { primary, replica } = testElement('div')
      primary.role = 'role'
      expect(replica.getAttribute('role')).toBe('role')
    })
  })

  describe('get textContent()', () => {
    it('returns text node data of children as a concatenated string.', () => {
      const { primary, replica } = testElement('div')
      const div = document.createElement('div')
      const textNode1 = document.createTextNode('text1')
      const textNode2 = document.createTextNode('text2')
      primary.appendChild(div)
      primary.appendChild(textNode2)
      div.appendChild(textNode1)
      expect(replica.textContent).toBe('text1text2')
    })

    it('returns values HTML entity encoded.', () => {
      const { primary, replica } = testElement('div')
      primary.innerHTML = '<div>&gt;</div>'
      expect(replica.textContent).toBe('>')
      const el = document.createElement('div')
      el.innerHTML = '<div id="testnode">&gt;howdy</div>'
      expect(el.textContent).toBe('>howdy')
      primary.appendChild(el)
      expect(replica.textContent).toBe('>>howdy')
      const el2 = document.createElement('div')
      el2.innerHTML = '<div id="testnode">&gt;&lt;&amp;&quot;&apos;&nbsp;</div>'
      expect(el2.textContent).toBe(`><&"'${String.fromCharCode(160)}`)
      const el3 = document.createElement('div')
      el3.innerHTML = '&#x3C;div&#x3E;Hello, world!&#x3C;/div&#x3E;'
      expect(el3.textContent).toBe('<div>Hello, world!</div>')
    })
  })

  describe('set textContent()', () => {
    it('replaces child nodes with a text node.', () => {
      const { primary, replica } = testElement('div')

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
      const { primary, replica } = testElement('div')
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

  describe('get innerHTML()', () => {
    it('returns HTML of children as a concatenated string.', () => {
      const { primary, replica } = testElement('div')
      const div = document.createElement('div')
      div.textContent = 'EXPECTED_TEXT'

      primary.appendChild(div)

      expect(replica.innerHTML).toBe('<div>EXPECTED_TEXT</div>')
    })
  })

  describe('set innerHTML()', () => {
    it('creates child nodes from provided HTML.', () => {
      const { primary, replica } = testElement('div')
      const div = document.createElement('div')
      const textNode = document.createTextNode('text1')

      primary.appendChild(document.createElement('div'))
      div.appendChild(textNode)

      primary.innerHTML = '<section>SOME_HTML<button>My button</button></section>'

      expect(replica.innerHTML).toBe('<section>SOME_HTML<button>My button</button></section>')
    })
  })

  describe('get innerHTML() 2', () => {
    it('returns HTML of an elements children as a concatenated string.', () => {
      const { primary, replica } = testElement('div')
      const div = document.createElement('div')
      const textNode1 = document.createTextNode('text1')

      primary.appendChild(div)
      primary.appendChild(textNode1)

      expect(replica.outerHTML).toBe('<div><div></div>text1</div>')
    })
  })

  describe('get outerHTML()', () => {
    it('returns HTML of an element and its children as a concatenated string.', () => {
      const { primary, replica } = testElement('div')
      const div = document.createElement('div')
      const textNode = document.createTextNode('text1')

      div.appendChild(textNode)

      primary.appendChild(div)

      expect(replica.innerHTML).toBe('<div>text1</div>')
    })
  })

  describe('set outerHTML()', () => {
    it('sets outer HTML of an element.', () => {
      const { primary, replica } = testElement('div')
      const div = document.createElement('div')
      const textNode = document.createTextNode('text1')

      div.appendChild(textNode)

      primary.appendChild(div)

      div.outerHTML = '<span>text2</span>'

      expect(replica.innerHTML).toBe('<span>text2</span>')
    })
  })

  describe('get attributes()', () => {
    it('returns all attributes as an object.', () => {
      const { primary, replica } = testElement('div')
      primary.setAttribute('key1', 'value1')
      primary.setAttribute('key2', 'value2')
      primary.setAttribute('key3', 'value3')

      expect(replica.attributes.length).toBe(3)

      expect(replica.attributes[0]!.name).toBe('key1')
      expect(replica.attributes[0]!.value).toBe('value1')
      expect(replica.attributes[0]!.namespaceURI).toBe(null)
      expect(replica.attributes[0]!.specified).toBe(true)
      expect(replica.attributes[0]!.ownerElement === replica).toBe(true)
      expect(replica.attributes[0]!.ownerDocument === replica.ownerDocument).toBe(true)

      expect(replica.attributes[1]!.name).toBe('key2')
      expect(replica.attributes[1]!.value).toBe('value2')
      expect(replica.attributes[1]!.namespaceURI).toBe(null)
      expect(replica.attributes[1]!.specified).toBe(true)
      expect(replica.attributes[1]!.ownerElement === replica).toBe(true)
      expect(replica.attributes[1]!.ownerDocument === replica.ownerDocument).toBe(true)

      expect(replica.attributes[2]!.name).toBe('key3')
      expect(replica.attributes[2]!.value).toBe('value3')
      expect(replica.attributes[2]!.namespaceURI).toBe(null)
      expect(replica.attributes[2]!.specified).toBe(true)
      expect(replica.attributes[2]!.ownerElement === replica).toBe(true)
      expect(replica.attributes[2]!.ownerDocument === replica.ownerDocument).toBe(true)

      expect(replica.getAttributeNode('key1')!.name).toBe('key1')
      expect(replica.getAttributeNode('key1')!.value).toBe('value1')
      expect(replica.getAttributeNode('key1')!.namespaceURI).toBe(null)
      expect(replica.getAttributeNode('key1')!.specified).toBe(true)
      expect(replica.getAttributeNode('key1')!.ownerElement === replica).toBe(true)
      expect(replica.getAttributeNode('key1')!.ownerDocument === replica.ownerDocument).toBe(true)

      expect(replica.getAttributeNode('key2')!.name).toBe('key2')
      expect(replica.getAttributeNode('key2')!.value).toBe('value2')
      expect(replica.getAttributeNode('key2')!.namespaceURI).toBe(null)
      expect(replica.getAttributeNode('key2')!.specified).toBe(true)
      expect(replica.getAttributeNode('key2')!.ownerElement === replica).toBe(true)
      expect(replica.getAttributeNode('key2')!.ownerDocument === replica.ownerDocument).toBe(true)

      expect(replica.getAttributeNode('key3')!.name).toBe('key3')
      expect(replica.getAttributeNode('key3')!.value).toBe('value3')
      expect(replica.getAttributeNode('key3')!.namespaceURI).toBe(null)
      expect(replica.getAttributeNode('key3')!.specified).toBe(true)
      expect(replica.getAttributeNode('key3')!.ownerElement === replica).toBe(true)
      expect(replica.getAttributeNode('key3')!.ownerDocument === replica.ownerDocument).toBe(true)
    })
  })

  describe('get childElementCount()', () => {
    it('returns child element count.', () => {
      const { primary, replica } = testElement('div')
      primary.appendChild(document.createElement('div'))
      primary.appendChild(document.createTextNode('test'))
      expect(replica.childElementCount).toEqual(1)
    })
  })

  describe('append()', () => {
    it('inserts a set of Node objects or DOMString objects after the last child of the ParentNode. DOMString objects are inserted as equivalent Text nodes.', () => {
      const { primary, replica } = testElement('div')

      const node1 = document.createComment('test1')
      const node2 = document.createComment('test2')

      primary.append(node1, node2)
      expect(replica.childNodes.length).toBe(2)
    })
  })

  describe('prepend()', () => {
    it('inserts a set of Node objects or DOMString objects before the first child of the ParentNode. DOMString objects are inserted as equivalent Text nodes.', () => {
      const { primary, replica } = testElement('div')

      const node1 = document.createComment('test1')
      const node2 = document.createComment('test2')

      primary.prepend(node1, node2)
      expect(replica.childNodes.length).toBe(2)
    })
  })

  describe('insertAdjacentElement()', () => {
    it('inserts a Node right before the reference element and returns with it.', () => {
      const { primary, replica } = testElement('div')

      const newNode = document.createElement('span')

      const insertedNode = primary.insertAdjacentElement('beforebegin', newNode)

      expect(replica.childNodes.length).toEqual(0)
      expect(insertedNode?.isConnected).toBe(true)
      expect(replica.parentNode?.childNodes[0]?.nodeType === newNode.nodeType).toBe(true)
    })

    it('inserts a Node inside the reference element before the first child and returns with it.', () => {
      const { primary, replica } = testElement('div')

      const child = document.createElement('span')
      const newNode = document.createElement('span')

      primary.appendChild(child)

      const insertedNode = primary.insertAdjacentElement('afterbegin', newNode)

      expect(insertedNode === newNode).toBe(true)
      expect(replica.childNodes[0]).toBeTruthy()
      expect(insertedNode?.isConnected).toBe(true)
    })

    it('inserts a Node inside the reference element after the last child and returns with it.', () => {
      const { primary, replica } = testElement('div')
      const child = document.createElement('span')
      const newNode = document.createElement('span')

      primary.appendChild(child)

      const insertedNode = primary.insertAdjacentElement('beforeend', newNode)

      expect(insertedNode === newNode).toBe(true)
      expect(replica.childNodes[1]).toBeTruthy()
    })

    it('inserts a Node right after the reference element and returns with it.', () => {
      const { primary, replica } = testElement('div')
      const newNode = document.createElement('span')

      const insertedNode = primary.insertAdjacentElement('afterend', newNode)

      expect(insertedNode === newNode).toBe(true)
      expect(replica.childNodes.length).toEqual(0)

      expect(replica.ownerDocument.body.childNodes[0]).toBeTruthy()
      expect(document.body.childNodes[1] === insertedNode).toBe(true)
    })

    it('inserts a Node right after the reference element and returns with it. 2', () => {
      const { primary, replica } = testElement('div')
      const newNode = document.createElement('span')

      primary.insertAdjacentElement('afterend', newNode)

      expect(replica.childNodes.length).toBe(0)
      expect(newNode.isConnected).toBe(true)

      expect(replica.ownerDocument.body.childNodes[0]).toBeTruthy()
      expect(replica.ownerDocument.body.childNodes[1]).toBeTruthy()
      expect(replica.ownerDocument.body.childNodes[2]).toBeTruthy()
    })

    it('returns with null if cannot insert with "afterend".', () => {
      const { primary } = testElement('div')
      primary.remove()
      const newNode = document.createElement('span')
      const insertedNode = primary.insertAdjacentElement('afterend', newNode)

      expect(insertedNode).toBe(null)
      expect(newNode.isConnected).toBe(false)
    })
  })

  describe('insertAdjacentHTML()', () => {
    it('inserts the given HTML right before the reference element.', () => {
      const { primary, replica } = testElement('div')
      const markup = '<span>markup</span>'

      primary.insertAdjacentHTML('beforebegin', markup)

      expect(replica.childNodes.length).toBe(0)
      expect((<IElement>replica.ownerDocument.body.childNodes[0]).outerHTML).toEqual(markup)
    })

    it('inserts the given HTML inside the reference element before the first child.', () => {
      const { primary, replica } = testElement('div')
      const child = document.createElement('span')
      const markup = '<span>markup</span>'

      primary.appendChild(child)
      primary.insertAdjacentHTML('afterbegin', markup)

      expect((<IElement>replica.childNodes[0]).outerHTML).toEqual(markup)
      expect(replica.childNodes[1]).toBeTruthy()
    })

    it('inserts the given HTML inside the reference element after the last child.', () => {
      const { primary, replica } = testElement('div')
      const child = document.createElement('span')
      const markup = '<span>markup</span>'

      primary.appendChild(child)
      primary.insertAdjacentHTML('beforeend', markup)

      expect(replica.childNodes[0]).toBeTruthy()
      expect((<IElement>replica.childNodes[1]).outerHTML).toEqual(markup)
    })

    it('inserts the given HTML right after the reference element.', () => {
      const { primary, replica } = testElement('div')
      const markup = '<span>markup</span>'

      primary.insertAdjacentHTML('afterend', markup)

      expect(replica.childNodes.length).toEqual(0)
      expect(replica.ownerDocument.body.childNodes[0]).toBeTruthy()
      expect((<IElement>replica.ownerDocument.body.childNodes[1]).outerHTML).toEqual(markup)
    })

    it('inserts the given HTML right after the reference element if it has a sibling.', () => {
      const { primary, replica } = testElement('div')
      const sibling = document.createElement('div')
      const markup = '<span>markup</span>'

      document.body.appendChild(sibling)
      primary.insertAdjacentHTML('afterend', markup)

      expect(replica.childNodes.length).toBe(0)
      expect(replica.ownerDocument.body.childNodes[0]).toBeTruthy()
      expect((<IElement>replica.ownerDocument.body.childNodes[1]).outerHTML).toEqual(markup)
      expect(replica.ownerDocument.body.childNodes[2]).toBeTruthy()
    })
  })

  describe('insertAdjacentText()', () => {
    it('inserts the given text right before the reference element.', () => {
      const { primary, replica } = testElement('div')
      const text = 'lorem'

      primary.insertAdjacentText('beforebegin', text)

      expect(replica.childNodes.length).toEqual(0)
      expect(replica.ownerDocument.body.childNodes[0]!.nodeType).toBe(Node.TEXT_NODE)
      expect(replica.ownerDocument.body.childNodes[0]!.textContent).toEqual(text)
    })

    it('inserts the given text inside the reference element before the first child.', () => {
      const { primary, replica } = testElement('div')
      const child = document.createElement('span')
      const text = 'lorem'

      primary.appendChild(child)
      primary.insertAdjacentText('afterbegin', text)

      expect(replica.childNodes[0]!.nodeType).toBe(Node.TEXT_NODE)
      expect(replica.childNodes[0]!.textContent).toEqual(text)
      expect(replica.childNodes[1]).toBe(child)
    })

    it('inserts the given text inside the reference element after the last child.', () => {
      const { primary, replica } = testElement('div')
      const child = document.createElement('span')
      const text = 'lorem'

      primary.appendChild(child)
      primary.insertAdjacentText('beforeend', text)

      expect(replica.childNodes[0]).toBeTruthy()
      expect(replica.childNodes[1]!.nodeType).toBe(Node.TEXT_NODE)
      expect(replica.childNodes[1]!.textContent).toEqual(text)
    })

    it('inserts the given text right after the reference element.', () => {
      const { primary, replica } = testElement('div')
      const text = 'lorem'

      primary.insertAdjacentText('afterend', text)

      expect(primary.childNodes.length).toBe(0)
      expect(replica.ownerDocument.body.childNodes[0]).toBeTruthy()
      expect(replica.ownerDocument.body.childNodes[1]!.nodeType).toBe(Node.TEXT_NODE)
      expect(replica.ownerDocument.body.childNodes[1]!.textContent).toEqual(text)
    })

    it('inserts the given text right after the reference element. 2', () => {
      const { primary, replica } = testElement('div')
      const sibling = document.createElement('div')
      const text = 'lorem'

      document.body.appendChild(sibling)
      primary.insertAdjacentText('afterend', text)

      expect(replica.childNodes.length).toBe(0)
      expect(replica.ownerDocument.body.childNodes[0]).toBeTruthy()
      expect(replica.ownerDocument.body.childNodes[1]!.nodeType).toBe(Node.TEXT_NODE)
      expect(replica.ownerDocument.body.childNodes[1]!.textContent).toEqual(text)
      expect(replica.ownerDocument.body.childNodes[2]).toBeTruthy()
    })

    it('does nothing is an emptry string is sent.', () => {
      const { primary, replica } = testElement('div')
      const sibling = document.createElement('div')

      document.body.appendChild(sibling)
      primary.insertAdjacentText('afterend', '')

      expect(replica.childNodes.length).toBe(0)
      expect(replica.ownerDocument.body.childNodes[0]).toBeTruthy()
      expect(replica.ownerDocument.body.childNodes[1]).toBeTruthy()
    })
  })

  describe('replaceChildren()', () => {
    it('replaces the existing children of a ParentNode with a specified new set of children.', () => {
      const { primary, replica } = testElement('div')
      const node1 = document.createComment('test1')
      const node2 = document.createComment('test2')

      primary.replaceChildren(node1, node2)
      expect(replica.childNodes.length).toBe(2)
    })
  })

  describe('matches()', () => {
    it('checks if the element matches a selector string.', () => {
      const { primary, replica } = testElement('div')

      primary.className = 'container active'

      expect(replica.matches('.container.active')).toBe(true)
    })

    it('checks if the element matches any selector in a string separated by comma.', () => {
      const { primary, replica } = testElement('div')

      primary.className = 'container active'

      expect(replica.matches('.container, .active')).toBe(true)
    })

    it('checks if the element matches a selector string containing escaped characters.', () => {
      const { primary, replica } = testElement('div')

      primary.className = 'foo:bar'

      expect(replica.matches(`.foo\\:bar`)).toBe(true)
    })

    it('checks if the element matches with a descendant combinator', () => {
      const { primary, replica } = testElement('div')
      primary.setAttribute('role', 'alert')

      const parentElement = document.createElement('div')
      parentElement.setAttribute('role', 'status')
      primary.appendChild(parentElement)

      const element = document.createElement('div')
      element.className = 'active'
      parentElement.appendChild(element)

      const replicaElement = replica.children[0]!.children[0]!

      expect(replicaElement.matches('div[role="alert"] div.active')).toBe(true)
      expect(replicaElement.matches('div[role="article"] div.active')).toBe(false)
      expect(replicaElement.matches('.nonexistent-class div.active')).toBe(false)
    })

    it('checks if a detached element matches with a descendant combinator', () => {
      const { primary, replica } = testElement('div')
      primary.setAttribute('role', 'status')

      const element = document.createElement('div')
      element.className = 'active'
      primary.appendChild(element)

      expect((replica.childNodes[0] as IElement).matches('div[role="status"] div.active')).toBe(true)
      expect((replica.childNodes[0] as IElement).matches('div[role="article"] div.active')).toBe(false)
      expect(replica.matches('.nonexistent-class div[role="status"]')).toBe(false)
    })

    it('checks if the element matches with a child combinator', () => {
      const { primary, replica } = testElement('div')
      primary.setAttribute('role', 'alert')

      const parentElement = document.createElement('div')
      primary.setAttribute('role', 'status')
      primary.appendChild(parentElement)

      const element = document.createElement('div')
      element.className = 'active'
      parentElement.appendChild(element)

      const replicaElement = replica.children[0]!.children[0]!

      expect(replicaElement.matches('div[role="status"] > div.active')).toBe(true)
      expect(replicaElement.matches('div[role="alert"] > div.active')).toBe(false)
      expect(replica.matches('div > div[role="alert"]')).toBe(false)
    })
  })

  describe('remove()', () => {
    it('removes the node from its parent.', () => {
      const { primary, replica } = testElement('div')
      expect(replica.isConnected).toBe(true)
      primary.remove()
      expect(replica.isConnected).toBe(false)
    })
  })

  describe('replaceWith()', () => {
    it('replaces a Node in the children list of its parent with a set of Node or DOMString objects.', () => {
      const { primary, replica } = testElement('div')

      const node1 = document.createComment('test1')
      const node2 = document.createComment('test2')

      primary.replaceWith(node1, node2)
      expect(replicaDocument.childNodes.length).toBe(2)
      expect(primary.isConnected).toBe(false)
      expect(replica.isConnected).toBe(false)
    })
  })

  describe('before()', () => {
    it('inserts a set of Node or DOMString objects in the children list of this ChildNode\'s parent, just before this ChildNode. DOMString objects are inserted as equivalent Text nodes.', () => {
      const { primary, replica } = testElement('div')

      const node1 = document.createComment('test1')
      const node2 = document.createComment('test2')

      primary.before(node1, node2)
      expect(replica.parentNode!.childNodes.length).toBe(3)
    })
  })

  describe('after()', () => {
    it('inserts a set of Node or DOMString objects in the children list of this ChildNode\'s parent, just after this ChildNode. DOMString objects are inserted as equivalent Text nodes.', () => {
      const { primary, replica } = testElement('div')

      const node1 = document.createComment('test1')
      const node2 = document.createComment('test2')

      primary.after(node1, node2)
      expect(replica.parentNode!.childNodes.length).toBe(3)
    })
  })

  describe('appendChild()', () => {
    it('updates the children property when appending an element child.', () => {
      const { primary, replica } = testElement('div')

      const div = document.createElement('div')
      const span = document.createElement('span')

      primary.appendChild(document.createComment('test'))
      primary.appendChild(div)
      primary.appendChild(document.createComment('test'))
      primary.appendChild(span)

      expect(replica.children.length).toBe(2)
      expect(replica.children[0]).toBeTruthy()
      expect(replica.children[1]).toBeTruthy()
    })

    // See: https://developer.mozilla.org/en-US/docs/Web/API/DocumentFragment
    it('append the children instead of the actual element if the type is DocumentFragment.', () => {
      const { primary, replica } = testElement('div')

      const template = <HTMLTemplateElement>document.createElement('template')

      template.innerHTML = '<div>Div</div><span>Span</span>'

      const clone = template.content.cloneNode(true)

      primary.appendChild(clone)

      expect(clone.childNodes.length).toBe(0)
      expect(clone.children.length).toBe(0)
      expect(replica.innerHTML).toBe('<div>Div</div><span>Span</span>')
    })

    it('removes child from previous parent.', () => {
      const { primary, replica } = testElement('div')

      const otherParent = testElement('div')
      const div = document.createElement('div')
      const span = document.createElement('span')
      const otherDiv = document.createElement('div')
      const otherSpan = document.createElement('span')

      div.setAttribute('id', 'div1')
      div.setAttribute('name', 'div2')
      span.setAttribute('id', 'span')
      otherDiv.setAttribute('id', 'otherDiv')
      otherSpan.setAttribute('id', 'otherSpan')

      otherParent.primary.appendChild(document.createComment('test'))
      otherParent.primary.appendChild(otherDiv)
      otherParent.primary.appendChild(document.createComment('test'))
      otherParent.primary.appendChild(div)
      otherParent.primary.appendChild(document.createComment('test'))
      otherParent.primary.appendChild(otherSpan)

      expect(otherParent.replica.children.length).toBe(3)
      expect(otherParent.replica.children[0]).toBeTruthy()
      expect(otherParent.replica.children[1]).toBeTruthy()
      expect(otherParent.replica.children[2]).toBeTruthy()
      // @ts-expect-error named children should work
      expect(otherParent.replica.children.div1).toBeTruthy()
      // @ts-expect-error named children should work
      expect(otherParent.replica.children.div2).toBeTruthy()
      // @ts-expect-error named children should work
      expect(otherParent.replica.children.otherDiv).toBeTruthy()
      // @ts-expect-error named children should work
      expect(otherParent.replica.children.otherSpan).toBeTruthy()

      primary.appendChild(document.createComment('test'))
      primary.appendChild(div)
      primary.appendChild(document.createComment('test'))
      primary.appendChild(span)

      expect(otherParent.replica.children.length).toBe(2)
      expect(otherParent.replica.children[0]).toBeTruthy()
      expect(otherParent.replica.children[1]).toBeTruthy()
      // @ts-expect-error named children should work
      expect(otherParent.replica.children.div1).toBeTruthy()
      // @ts-expect-error named children should work
      expect(otherParent.replica.children.div2).toBeTruthy()
      // @ts-expect-error named children should work
      expect(otherParent.replica.children.otherDiv).toBeTruthy()
      // @ts-expect-error named children should work
      expect(otherParent.replica.children.otherSpan).toBeTruthy()

      expect(replica.children.length).toBe(2)
      expect(replica.children[0]).toBeTruthy()
      expect(replica.children[1]).toBeTruthy()
      // @ts-expect-error named children should work
      expect(replica.children.div1).toBeTruthy()
      // @ts-expect-error named children should work
      expect(replica.children.div2).toBeTruthy()
      // @ts-expect-error named children should work
      expect(replica.children.span).toBeTruthy()
    })
  })

  describe('removeChild()', () => {
    it('updates the children property when removing an element child.', () => {
      const { primary, replica } = testElement('div')

      const div = document.createElement('div')
      const span = document.createElement('span')

      div.setAttribute('name', 'div')
      span.setAttribute('name', 'span')

      primary.appendChild(document.createComment('test'))
      primary.appendChild(div)
      primary.appendChild(document.createComment('test'))
      primary.appendChild(span)

      // @ts-expect-error named children should work
      expect(replica.children.div).toBeTruthy()
      // @ts-expect-error named children should work
      expect(replica.children.span).toBeTruthy()

      primary.removeChild(div)

      expect(replica.children.length).toBe(1)
      expect(replica.children[0]).toBeTruthy()
      // @ts-expect-error named children should work
      expect(replica.children.div).toBeFalsy()
      // @ts-expect-error named children should work
      expect(replica.children.span).toBeTruthy()
    })
  })

  describe('insertBefore()', () => {
    it('updates the children property when appending an element child.', () => {
      const { primary, replica } = testElement('div')

      const div1 = document.createElement('div')
      const div2 = document.createElement('div')
      const span = document.createElement('span')

      primary.appendChild(document.createComment('test'))
      primary.appendChild(div1)
      primary.appendChild(document.createComment('test'))
      primary.appendChild(span)
      primary.insertBefore(div2, div1)

      expect(replica.children.length).toBe(3)
      expect(replica.children[0]).toBeTruthy()
      expect(replica.children[1]).toBeTruthy()
      expect(replica.children[2]).toBeTruthy()
    })

    it('inserts elements of the same parent correctly.', () => {
      const { primary, replica } = testElement('div')
      primary.innerHTML
				= '<span id="a"></span><span id="b"></span><span id="c"></span><span id="d"></span>'

      const a = <IElement>primary.querySelector('#a')
      const b = <IElement>primary.querySelector('#b')

      primary.insertBefore(a, b)

      expect(replica.innerHTML).toBe(
        '<span id="a"></span><span id="b"></span><span id="c"></span><span id="d"></span>',
      )
    })

    it('after should add child element correctly', () => {
      const { primary, replica } = testElement('div')
      primary.innerHTML = `<div class="container"></div>\n`
      expect(replica.children.length).toBe(1)
      const container = document.querySelector('.container')

      const div1 = document.createElement('div')
      div1.classList.add('someClassName')
      div1.innerHTML = 'div1'
      container?.after(div1)
      expect(replica.children.length).toBe(2)

      const div2 = document.createElement('div')
      div2.classList.add('someClassName')
      div2.innerHTML = 'div2'
      div1.after(div2)

      expect(replica.children.length).toBe(3)
      expect(replica.children[1]).toBeTruthy()
      expect(replica.children[2]).toBeTruthy()
      expect(replica.ownerDocument.getElementsByClassName('someClassName').length).toBe(2)
    })

    it('insert before comment node should be at the correct location.', () => {
      const { primary, replica } = testElement('div')

      const span1 = document.createElement('span')
      const span2 = document.createElement('span')
      const span3 = document.createElement('span')
      const comment = document.createComment('test')

      primary.appendChild(span1)
      primary.appendChild(comment)
      primary.appendChild(span2)
      primary.insertBefore(span3, comment)

      expect(replica.children.length).toBe(3)
      expect(replica.children[0]).toBeTruthy()
      expect(replica.children[1]).toBeTruthy()
      expect(replica.children[2]).toBeTruthy()
    })

    // See: https://developer.mozilla.org/en-US/docs/Web/API/DocumentFragment
    it('insert the children instead of the actual element before another reference Node if the type is DocumentFragment.', () => {
      const { primary, replica } = testElement('div')

      const child1 = document.createElement('span')
      const child2 = document.createElement('span')
      const template = <HTMLTemplateElement>document.createElement('template')

      template.innerHTML = '<div>Template DIV 1</div><span>Template SPAN 1</span>'

      const clone = template.content.cloneNode(true)

      primary.appendChild(child1)
      primary.appendChild(child2)

      primary.insertBefore(clone, child2)

      expect(replica.children.length).toBe(4)
      expect(replica.innerHTML).toEqual(
        '<span></span><div>Template DIV 1</div><span>Template SPAN 1</span><span></span>',
      )
    })

    it('removes child from previous parent node when moved.', () => {
      const { primary, replica } = testElement('div')

      const div = document.createElement('div')
      const span1 = document.createElement('span')
      const span2 = document.createElement('span')
      const otherParent = testElement('div')
      const otherSpan1 = document.createElement('span')
      const otherSpan2 = document.createElement('span')

      div.setAttribute('id', 'div')
      span1.setAttribute('id', 'span1')
      span2.setAttribute('id', 'span2')
      otherSpan1.setAttribute('id', 'otherSpan1')
      otherSpan2.setAttribute('id', 'otherSpan2')

      otherParent.primary.appendChild(document.createComment('test'))
      otherParent.primary.appendChild(otherSpan1)
      otherParent.primary.appendChild(document.createComment('test'))
      otherParent.primary.appendChild(otherSpan2)
      otherParent.primary.insertBefore(div, otherSpan2)

      expect(otherParent.replica.children.length).toBe(3)
      expect(otherParent.replica.children[0]).toBeTruthy()
      expect(otherParent.replica.children[1]).toBeTruthy()
      expect(otherParent.replica.children[2]).toBeTruthy()
      // @ts-expect-error named children should work
      expect(otherParent.replica.children.otherSpan1).toBeTruthy()
      // @ts-expect-error named children should work
      expect(otherParent.replica.children.div).toBeTruthy()
      // @ts-expect-error named children should work
      expect(otherParent.replica.children.otherSpan2).toBeTruthy()

      primary.appendChild(document.createComment('test'))
      primary.appendChild(span1)
      primary.appendChild(document.createComment('test'))
      primary.appendChild(document.createComment('test'))
      primary.appendChild(span2)
      primary.appendChild(document.createComment('test'))

      primary.insertBefore(div, span2)

      expect(otherParent.replica.children.length).toBe(2)
      expect(otherParent.replica.children[0]).toBeTruthy()
      expect(otherParent.replica.children[1]).toBeTruthy()
      // @ts-expect-error named children should work
      expect(otherParent.replica.children.div === undefined).toBe(true)
      // @ts-expect-error named children should work
      expect(otherParent.replica.children.otherSpan1).toBeTruthy()
      // @ts-expect-error named children should work
      expect(otherParent.replica.children.otherSpan2).toBeTruthy()

      expect(replica.children.length).toBe(3)
      expect(replica.children[0] === span1).toBe(true)
      expect(replica.children[1] === div).toBe(true)
      expect(replica.children[2] === span2).toBe(true)
      // @ts-expect-error named children should work
      expect(replica.children.span1 === span1).toBe(true)
      // @ts-expect-error named children should work
      expect(replica.children.div === div).toBe(true)
      // @ts-expect-error named children should work
      expect(replica.children.span2 === span2).toBe(true)
    })
  })

  describe('attributeChangedCallback()', () => {
    it('calls attribute changed callback when it is implemented by a custom element (web component).', () => {
      const { primary, replica } = testElement('div')
      const customElement = <CustomElement>document.createElement('custom-element')

      primary.appendChild(customElement)

      customElement.setAttribute('key1', 'value1')
      customElement.setAttribute('key2', 'value2')
      customElement.setAttribute('KEY1', 'newValue')

      const replicaElement = replica.childNodes[0] as CustomElement

      expect(replicaElement.changedAttributes.length).toBe(3)

      expect(replicaElement.changedAttributes[0]?.name).toBe('key1')
      expect(replicaElement.changedAttributes[0]?.newValue).toBe('value1')
      expect(replicaElement.changedAttributes[0]?.oldValue).toBe(null)

      expect(replicaElement.changedAttributes[1]?.name).toBe('key2')
      expect(replicaElement.changedAttributes[1]?.newValue).toBe('value2')
      expect(replicaElement.changedAttributes[1]?.oldValue).toBe(null)

      expect(replicaElement.changedAttributes[2]?.name).toBe('key1')
      expect(replicaElement.changedAttributes[2]?.newValue).toBe('newValue')
      expect(replicaElement.changedAttributes[2]?.oldValue).toBe('value1')
    })

    it('does not call the attribute changed callback when the attribute name is not available in the observedAttributes() getter method.', () => {
      const { primary, replica } = testElement('div')
      const customElement = <CustomElement>document.createElement('custom-element')

      primary.appendChild(customElement)

      customElement.setAttribute('k1', 'value1')
      customElement.setAttribute('k2', 'value2')

      const replicaElement = replica.childNodes[0] as CustomElement

      expect(replicaElement.changedAttributes.length).toBe(0)
    })
  })

  describe('setAttribute()', () => {
    it('sets an attribute on an element.', () => {
      const { primary, replica } = testElement('div')

      primary.setAttribute('key1', 'value1')
      primary.setAttribute('key2', '')

      expect(replica.attributes.length).toBe(2)

      expect(replica.attributes[0]!.name).toBe('key1')
      expect(replica.attributes[0]!.value).toBe('value1')
      expect(replica.attributes[0]!.namespaceURI).toBe(null)
      expect(replica.attributes[0]!.specified).toBe(true)
      expect(replica.attributes[0]!.ownerElement === replica).toBe(true)
      expect(replica.attributes[0]!.ownerDocument === document).toBe(true)

      expect(replica.attributes[1]!.name).toBe('key2')
      expect(replica.attributes[1]!.value).toBe('')
      expect(replica.attributes[1]!.namespaceURI).toBe(null)
      expect(replica.attributes[1]!.specified).toBe(true)
      expect(replica.attributes[1]!.ownerElement === replica).toBe(true)
      expect(replica.attributes[1]!.ownerDocument === document).toBe(true)

      // @ts-expect-error named attributes should work
      expect(replica.attributes.key1.name).toBe('key1')
      // @ts-expect-error named attributes should work
      expect(replica.attributes.key1.value).toBe('value1')
      // @ts-expect-error named attributes should work
      expect(replica.attributes.key1.namespaceURI).toBe(null)
      // @ts-expect-error named attributes should work
      expect(replica.attributes.key1.specified).toBe(true)
      // @ts-expect-error named attributes should work
      expect(replica.attributes.key1.ownerElement === replica).toBe(true)
      // @ts-expect-error named attributes should work
      expect(replica.attributes.key1.ownerDocument === document).toBe(true)

      // @ts-expect-error named attributes should work
      expect(replica.attributes.key2.name).toBe('key2')
      // @ts-expect-error named attributes should work
      expect(replica.attributes.key2.value).toBe('')
      // @ts-expect-error named attributes should work
      expect(replica.attributes.key2.namespaceURI).toBe(null)
      // @ts-expect-error named attributes should work
      expect(replica.attributes.key2.specified).toBe(true)
      // @ts-expect-error named attributes should work
      expect(replica.attributes.key2.ownerElement === replica).toBe(true)
      // @ts-expect-error named attributes should work
      expect(replica.attributes.key2.ownerDocument === document).toBe(true)
    })
  })

  describe('setAttributeNS()', () => {
    it('sets a namespace attribute on an element.', () => {
      const { primary, replica } = testElement('div')

      primary.setAttributeNS(NAMESPACE_URI, 'global:local1', 'value1')
      primary.setAttributeNS(NAMESPACE_URI, 'global:local2', '')

      expect(replica.attributes.length).toBe(2)

      expect(replica.attributes[0]!.name).toBe('global:local1')
      expect(replica.attributes[0]!.value).toBe('value1')
      expect(replica.attributes[0]!.namespaceURI).toBe(NAMESPACE_URI)
      expect(replica.attributes[0]!.specified).toBe(true)
      expect(replica.attributes[0]!.ownerElement === replica).toBe(true)
      expect(replica.attributes[0]!.ownerDocument === replicaDocument).toBe(true)

      expect(replica.attributes[1]!.name).toBe('global:local2')
      expect(replica.attributes[1]!.value).toBe('')
      expect(replica.attributes[1]!.namespaceURI).toBe(NAMESPACE_URI)
      expect(replica.attributes[1]!.specified).toBe(true)
      expect(replica.attributes[1]!.ownerElement === replica).toBe(true)
      expect(replica.attributes[1]!.ownerDocument === replicaDocument).toBe(true)

      // @ts-expect-error named attributes should work
      expect(replica.attributes['global:local1'].name).toBe('global:local1')
      // @ts-expect-error named attributes should work
      expect(replica.attributes['global:local1'].value).toBe('value1')
      // @ts-expect-error named attributes should work
      expect(replica.attributes['global:local1'].namespaceURI).toBe(NAMESPACE_URI)
      // @ts-expect-error named attributes should work
      expect(replica.attributes['global:local1'].specified).toBe(true)
      // @ts-expect-error named attributes should work
      expect(replica.attributes['global:local1'].ownerElement === replica).toBe(true)
      // @ts-expect-error named attributes should work
      expect(replica.attributes['global:local1'].ownerDocument === replicaDocument).toBe(true)

      // @ts-expect-error named attributes should work
      expect(replica.attributes['global:local2'].name).toBe('global:local2')
      // @ts-expect-error named attributes should work
      expect(replica.attributes['global:local2'].value).toBe('')
      // @ts-expect-error named attributes should work
      expect(replica.attributes['global:local2'].namespaceURI).toBe(NAMESPACE_URI)
      // @ts-expect-error named attributes should work
      expect(replica.attributes['global:local2'].specified).toBe(true)
      // @ts-expect-error named attributes should work
      expect(replica.attributes['global:local2'].ownerElement === replica).toBe(true)
      // @ts-expect-error named attributes should work
      expect(replica.attributes['global:local2'].ownerDocument === replicaDocument).toBe(true)
    })
  })

  describe('getAttributeNames()', () => {
    it('returns attribute names.', () => {
      const { primary, replica } = testElement('div')

      primary.setAttributeNS(NAMESPACE_URI, 'global:local1', 'value1')
      primary.setAttribute('key1', 'value1')
      primary.setAttribute('key2', '')
      expect(replica.getAttributeNames()).toEqual(['global:local1', 'key1', 'key2'])
    })
  })

  describe('hasAttribute()', () => {
    it('returns "true" if an element has an attribute.', () => {
      const { primary, replica } = testElement('div')

      primary.setAttribute('key1', 'value1')
      primary.setAttribute('key2', '')
      expect(replica.hasAttribute('key1')).toBe(true)
      expect(replica.hasAttribute('key2')).toBe(true)
      primary.removeAttribute('key1')
      primary.removeAttribute('key2')
      expect(replica.hasAttribute('key1')).toBe(false)
      expect(replica.hasAttribute('key2')).toBe(false)
    })
  })

  describe('hasAttributeNS()', () => {
    it('returns "true" if an element has a namespace attribute.', () => {
      const { primary, replica } = testElement('div')

      primary.setAttributeNS(NAMESPACE_URI, 'global:local1', 'value1')
      primary.setAttributeNS(NAMESPACE_URI, 'global:local2', '')
      expect(replica.hasAttributeNS(NAMESPACE_URI, 'local1')).toBe(true)
      expect(replica.hasAttributeNS(NAMESPACE_URI, 'local2')).toBe(true)
      primary.removeAttributeNS(NAMESPACE_URI, 'local1')
      primary.removeAttributeNS(NAMESPACE_URI, 'local2')
      expect(replica.hasAttributeNS(NAMESPACE_URI, 'local1')).toBe(false)
      expect(replica.hasAttributeNS(NAMESPACE_URI, 'local2')).toBe(false)
    })
  })

  describe('removeAttribute()', () => {
    it('removes an attribute.', () => {
      const { primary, replica } = testElement('div')

      primary.setAttribute('key1', 'value1')
      primary.removeAttribute('key1')
      expect(replica.attributes.length).toBe(0)
    })
  })

  describe('removeAttributeNS()', () => {
    it('removes a namespace attribute.', () => {
      const { primary, replica } = testElement('div')

      primary.setAttributeNS(NAMESPACE_URI, 'global:local', 'value')
      primary.removeAttributeNS(NAMESPACE_URI, 'local')
      expect(replica.attributes.length).toBe(0)
    })
  })

  describe('toggleAttribute()', () => {
    it('toggles an attribute.', () => {
      const { primary, replica } = testElement('div')

      primary.toggleAttribute('key1')
      expect(replica.hasAttribute('key1')).toBe(true)
      primary.toggleAttribute('key1')
      expect(replica.hasAttribute('key1')).toBe(false)
      primary.toggleAttribute('key1', true)
      expect(replica.hasAttribute('key1')).toBe(true)
      primary.toggleAttribute('key1', true)
      expect(replica.hasAttribute('key1')).toBe(true)
      primary.toggleAttribute('key1', false)
      expect(replica.hasAttribute('key1')).toBe(false)
    })
  })

  describe('attachShadow()', () => {
    it('creates a new open ShadowRoot node and sets it to the "shadowRoot" property.', () => {
      const { primary, replica } = testElement('div')

      primary.attachShadow({ mode: 'open' })
      expect(replica instanceof ShadowRoot).toBe(true)
      expect(replica.shadowRoot instanceof ShadowRoot).toBe(true)
      expect(replica.shadowRoot.ownerDocument === replica.ownerDocument).toBe(true)
    })

    it('creates a new closed ShadowRoot node and sets it to the internal "[PropertySymbol.shadowRoot]" property.', () => {
      const { primary, replica } = testElement('div')

      primary.attachShadow({ mode: 'closed' })
      expect(replica.shadowRoot).toBe(null)
      expect(replica instanceof ShadowRoot).toBe(true)
      expect(replica.isConnected).toBe(false)
      expect(replica.isConnected).toBe(true)
    })
  })

  for (const functionName of ['scroll', 'scrollTo'] as const) {
    describe(`${functionName}()`, () => {
      it('sets the properties scrollTop and scrollLeft.', () => {
        const { primary, replica } = testElement('div')
        primary[functionName](50, 60)
        expect(replica.scrollLeft).toBe(50)
        expect(replica.scrollTop).toBe(60)
      })
    })

    describe(`${functionName}()`, () => {
      it('sets the properties scrollTop and scrollLeft using object.', () => {
        const { primary, replica } = testElement('div')

        // @ts-expect-error should work
        primary[functionName]({ left: 50, top: 60 })
        expect(replica.scrollLeft).toBe(50)
        expect(replica.scrollTop).toBe(60)
      })
    })

    describe(`${functionName}()`, () => {
      it('sets only the property scrollTop.', () => {
        const { primary, replica } = testElement('div')

        // @ts-expect-error should work
        primary[functionName]({ top: 60 })
        expect(replica.scrollLeft).toBe(0)
        expect(replica.scrollTop).toBe(60)
      })
    })

    describe(`${functionName}()`, () => {
      it('sets only the property scrollLeft.', () => {
        const { primary, replica } = testElement('div')

        // @ts-expect-error should work
        primary[functionName]({ left: 60 })
        expect(replica.scrollLeft).toBe(60)
        expect(replica.scrollTop).toBe(0)
      })
    })

    describe(`${functionName}()`, () => {
      it('sets the properties scrollTop and scrollLeft with animation.', async () => {
        const { primary, replica } = testElement('div')

        // @ts-expect-error should work
        primary[functionName]({ left: 50, top: 60, behavior: 'smooth' })
        expect(replica.scrollLeft).toBe(0)
        expect(replica.scrollTop).toBe(0)
        await window.happyDOM?.waitUntilComplete()
        expect(replica.scrollLeft).toBe(50)
        expect(replica.scrollTop).toBe(60)
      })
    })
  }

  for (const method of ['setAttributeNode', 'setAttributeNodeNS'] as const) {
    describe(`${method}()`, () => {
      it('sets an Attr node on a <div> element.', () => {
        const { primary, replica } = testElement('div')

        const attribute1 = document.createAttributeNS(NamespaceURI.svg, 'KEY1')
        const attribute2 = document.createAttribute('KEY2')

        attribute1.value = 'value1'
        attribute2.value = 'value2'

        primary[method](attribute1)
        primary[method](attribute2)

        expect(replica.attributes.length).toBe(2)

        expect((<IAttr>replica.attributes[0]).name).toBe('key1')
        expect((<IAttr>replica.attributes[0]).namespaceURI).toBe(NamespaceURI.svg)
        expect((<IAttr>replica.attributes[0]).value).toBe('value1')
        expect((<IAttr>replica.attributes[0]).specified).toBe(true)
        expect((<IAttr>replica.attributes[0]).ownerElement).toBe(replica)
        expect((<IAttr>replica.attributes[0]).ownerDocument).toBe(replicaDocument)

        expect((<IAttr>replica.attributes[1]).name).toBe('key2')
        expect((<IAttr>replica.attributes[1]).namespaceURI).toBe(null)
        expect((<IAttr>replica.attributes[1]).value).toBe('value2')
        expect((<IAttr>replica.attributes[1]).specified).toBe(true)
        expect((<IAttr>replica.attributes[1]).ownerElement).toBe(replica)
        expect((<IAttr>replica.attributes[1]).ownerDocument).toBe(document)

        // @ts-expect-error named attributes should work
        expect((<IAttr>replica.attributes.key1).name).toBe('key1')
        // @ts-expect-error named attributes should work
        expect((<IAttr>replica.attributes.key1).namespaceURI).toBe(NamespaceURI.svg)
        // @ts-expect-error named attributes should work
        expect((<IAttr>replica.attributes.key1).value).toBe('value1')
        // @ts-expect-error named attributes should work
        expect((<IAttr>replica.attributes.key1).specified).toBe(true)
        // @ts-expect-error named attributes should work
        expect((<IAttr>replica.attributes.key1).ownerElement).toBe(replica)
        // @ts-expect-error named attributes should work
        expect((<IAttr>replica.attributes.key1).ownerDocument).toBe(replicaDocument)

        // @ts-expect-error named attributes should work
        expect((<IAttr>replica.attributes.key2).name).toBe('key2')
        // @ts-expect-error named attributes should work
        expect((<IAttr>replica.attributes.key2).namespaceURI).toBe(null)
        // @ts-expect-error named attributes should work
        expect((<IAttr>replica.attributes.key2).value).toBe('value2')
        // @ts-expect-error named attributes should work
        expect((<IAttr>replica.attributes.key2).specified).toBe(true)
        // @ts-expect-error named attributes should work
        expect((<IAttr>replica.attributes.key2).ownerElement).toBe(replica)
        // @ts-expect-error named attributes should work
        expect((<IAttr>replica.attributes.key2).ownerDocument).toBe(replicaDocument)
      })

      it('sets an Attr node on an <svg> element.', () => {
        const { primary, replica } = testElement('div')
        const svg = primary.appendChild(
          document.createElementNS(NamespaceURI.svg, 'svg'),
        ) as Element

        const replicaSvg = replica.children[0]!

        const attribute1 = document.createAttributeNS(NamespaceURI.svg, 'KEY1')
        const attribute2 = document.createAttribute('KEY2')

        attribute1.value = 'value1'
        attribute2.value = 'value2'

        svg[method](attribute1)
        svg[method](attribute2)

        expect(replicaSvg.attributes.length).toBe(2)

        expect((<IAttr>replicaSvg.attributes[0]).name).toBe('KEY1')
        expect((<IAttr>replicaSvg.attributes[0]).namespaceURI).toBe(NamespaceURI.svg)
        expect((<IAttr>replicaSvg.attributes[0]).value).toBe('value1')
        expect((<IAttr>replicaSvg.attributes[0]).specified).toBe(true)
        expect((<IAttr>replicaSvg.attributes[0]).ownerElement).toBe(replicaSvg)
        expect((<IAttr>replicaSvg.attributes[0]).ownerDocument).toBe(replicaDocument)

        expect((<IAttr>replicaSvg.attributes[1]).name).toBe('key2')
        expect((<IAttr>replicaSvg.attributes[1]).namespaceURI).toBe(null)
        expect((<IAttr>replicaSvg.attributes[1]).value).toBe('value2')
        expect((<IAttr>replicaSvg.attributes[1]).specified).toBe(true)
        expect((<IAttr>replicaSvg.attributes[1]).ownerElement).toBe(replicaSvg)
        expect((<IAttr>replicaSvg.attributes[1]).ownerDocument).toBe(replicaDocument)

        // @ts-expect-error named attributes should work
        expect((<IAttr>replicaSvg.attributes.KEY1).name).toBe('KEY1')
        // @ts-expect-error named attributes should work
        expect((<IAttr>replicaSvg.attributes.KEY1).namespaceURI).toBe(NamespaceURI.svg)
        // @ts-expect-error named attributes should work
        expect((<IAttr>replicaSvg.attributes.KEY1).value).toBe('value1')
        // @ts-expect-error named attributes should work
        expect((<IAttr>replicaSvg.attributes.KEY1).specified).toBe(true)
        // @ts-expect-error named attributes should work
        expect((<IAttr>replicaSvg.attributes.KEY1).ownerElement).toBe(replicaSvg)
        // @ts-expect-error named attributes should work
        expect((<IAttr>replicaSvg.attributes.KEY1).ownerDocument).toBe(replicaDocument)

        // @ts-expect-error named attributes should work
        expect((<IAttr>replicaSvg.attributes.key2).name).toBe('key2')
        // @ts-expect-error named attributes should work
        expect((<IAttr>replicaSvg.attributes.key2).namespaceURI).toBe(null)
        // @ts-expect-error named attributes should work
        expect((<IAttr>replicaSvg.attributes.key2).value).toBe('value2')
        // @ts-expect-error named attributes should work
        expect((<IAttr>replicaSvg.attributes.key2).specified).toBe(true)
        // @ts-expect-error named attributes should work
        expect((<IAttr>replicaSvg.attributes.key2).ownerElement).toBe(replicaSvg)
        // @ts-expect-error named attributes should work
        expect((<IAttr>replicaSvg.attributes.key2).ownerDocument).toBe(replicaDocument)
      })
    })
  }

  describe(`getAttributeNode()`, () => {
    it('returns an Attr node from a <div> element.', () => {
      const { primary, replica } = testElement('div')

      const attribute1 = document.createAttributeNS(NamespaceURI.svg, 'KEY1')
      const attribute2 = document.createAttribute('KEY2')

      attribute1.value = 'value1'
      attribute2.value = 'value2'

      primary.setAttributeNode(attribute1)
      primary.setAttributeNode(attribute2)

      expect(replica.getAttributeNode('key1')?.value === attribute1.value).toBe(true)
      expect(replica.getAttributeNode('key2')?.value === attribute2.value).toBe(true)
      expect(replica.getAttributeNode('KEY1')?.value === attribute1.value).toBe(true)
      expect(replica.getAttributeNode('KEY2')?.value === attribute2.value).toBe(true)
    })

    it('returns an Attr node from an <svg> element.', () => {
      const { primary, replica } = testElement('div')
      const svg = primary.appendChild(
        document.createElementNS(NamespaceURI.svg, 'svg'),
      ) as Element
      const replicaSvg = replica.children[0]!

      const attribute1 = document.createAttributeNS(NamespaceURI.svg, 'KEY1')
      const attribute2 = document.createAttribute('KEY2')

      attribute1.value = 'value1'
      attribute2.value = 'value2'

      svg.setAttributeNode(attribute1)
      svg.setAttributeNode(attribute2)

      expect(replicaSvg.getAttributeNode('key1') === null).toBe(true)
      expect(replicaSvg.getAttributeNode('key2') === attribute2).toBe(true)
      expect(replicaSvg.getAttributeNode('KEY1') === attribute1).toBe(true)
      expect(replicaSvg.getAttributeNode('KEY2') === null).toBe(true)
    })
  })

  describe(`getAttributeNode() 2`, () => {
    it('returns a namespaced Attr node from a <div> element.', () => {
      const { primary, replica } = testElement('div')

      const attribute1 = document.createAttributeNS(NamespaceURI.svg, 'KEY1')

      attribute1.value = 'value1'

      primary.setAttributeNode(attribute1)

      expect(replica.getAttributeNodeNS(NamespaceURI.svg, 'key1')?.value)
        .toEqual(attribute1.value)
      expect(replica.getAttributeNodeNS(NamespaceURI.svg, 'KEY1')?.value)
        .toEqual(attribute1.value)
    })

    it('returns an Attr node from an <svg> element.', () => {
      const { primary, replica } = testElement('div')
      const svg = primary.appendChild(
        document.createElementNS(NamespaceURI.svg, 'svg'),
      ) as Element
      const replicaSvg = replica.children[0]!

      const attribute1 = document.createAttributeNS(NamespaceURI.svg, 'KEY1')

      attribute1.value = 'value1'

      svg.setAttributeNode(attribute1)

      expect(replicaSvg.getAttributeNodeNS(NamespaceURI.svg, 'key1') === null).toBe(true)
      expect(replicaSvg.getAttributeNodeNS(NamespaceURI.svg, 'KEY1')).toEqual(attribute1)
      expect(replicaSvg.getAttributeNodeNS(NamespaceURI.svg, 'KEY2') === null).toBe(true)
    })
  })

  describe('removeAttributeNode()', () => {
    it('removes an Attr node.', () => {
      const { primary, replica } = testElement('div')
      const attribute = document.createAttribute('KEY1')

      attribute.value = 'value1'
      primary.setAttributeNode(attribute)
      primary.removeAttributeNode(attribute)

      expect(replica.attributes.length).toBe(0)
    })
  })

  describe('replaceWith() 2', () => {
    it('replaces a node with another node.', () => {
      const { primary, replica } = testElement('div')

      const newChild = document.createElement('span')
      newChild.className = 'child4'
      primary.innerHTML
				= '<span class="child1"></span><span class="child2"></span><span class="child3"></span>'

      primary.children[2]!.replaceWith(newChild)
      expect(replica.innerHTML).toBe(
        '<span class="child1"></span><span class="child2"></span><span class="child4"></span>',
      )
    })

    it('replaces a node with a mixed list of Node and DOMString (string).', () => {
      const { primary, replica } = testElement('div')

      const newChildrenParent = document.createElement('div')
      const newChildrenHtml
				= '<span class="child4"></span><span class="child5"></span><span class="child6"></span>'
      newChildrenParent.innerHTML
				= '<span class="child7"></span><span class="child8"></span><span class="child9"></span>'
      primary.innerHTML
				= '<span class="child1"></span><span class="child2"></span><span class="child3"></span>'

      primary.children[2]!.replaceWith(...[newChildrenHtml, ...newChildrenParent.children])
      expect(replica.innerHTML).toBe(
        '<span class="child1"></span><span class="child2"></span><span class="child4"></span><span class="child5"></span><span class="child6"></span><span class="child7"></span><span class="child8"></span><span class="child9"></span>',
      )
    })
  })

  describe('scroll()', () => {
    it('sets the properties "scrollTop" and "scrollLeft".', () => {
      const { primary, replica } = testElement('div')

      primary.scroll(10, 15)
      expect(replica.scrollLeft).toBe(10)
      expect(replica.scrollTop).toBe(15)
    })
  })
})
