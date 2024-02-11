/*
  This file is derived from:
  https://github.com/capricorn86/happy-dom/blob/6cbcc10a1a227b36e38a7bc33203b2ae029cca95/packages/happy-dom/test/nodes/character-data/CharaterData.test.ts ,
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
import type { IDocument, IWindow } from 'happy-dom'
import { Window } from 'happy-dom'
import { addTestElement, initTestReplicaDom } from '../../test-setup.js'

describe('charaterData', () => {
  let window: IWindow
  let document: IDocument

  let replicaWindow: IWindow
  let replicaDocument: IDocument

  beforeEach(() => {
    window = new Window()
    document = window.document

    replicaWindow = new Window()
    replicaDocument = replicaWindow.document

    initTestReplicaDom(window, replicaDocument)
  })

  function testComment(type: string) {
    return addTestElement(
      document,
      replicaDocument,
      type,
      'createComment',
    )
  }

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('get length()', () => {
    it('returns "#comment".', () => {
      const { replica } = testComment('test')
      expect(replica.length).toBe(4)
    })
  })

  describe('get data()', () => {
    it('returns text content.', () => {
      const { replica } = testComment('test')
      expect(replica.data).toBe('test')
    })
  })

  describe('set data()', () => {
    it('sets text content.', () => {
      const { primary, replica } = testComment('test')
      primary.data = 'new text'
      expect(replica.data).toBe('new text')
      primary.data = <string>(<unknown>0)
      expect(replica.data).toBe('0')
    })
  })

  describe('get nodeValue()', () => {
    it('returns text content.', () => {
      const { replica } = testComment('test')
      expect(replica.nodeValue).toBe('test')
    })
  })

  describe('set nodeValue()', () => {
    it('sets text content.', () => {
      const { primary, replica } = testComment('test')
      primary.nodeValue = 'new text'
      expect(replica.nodeValue).toBe('new text')
      primary.nodeValue = <string>(<unknown>0)
      expect(replica.nodeValue).toBe('0')
    })
  })

  describe('get textContent()', () => {
    it('returns text content.', () => {
      const { replica } = testComment('test')
      expect(replica.textContent).toBe('test')
    })
  })

  describe('set textContent()', () => {
    it('sets text content.', () => {
      const { primary, replica } = testComment('test')
      primary.textContent = 'new text'
      expect(replica.textContent).toBe('new text')
      primary.textContent = <string>(<unknown>0)
      expect(replica.textContent).toBe('0')
    })
  })

  describe('appendData()', () => {
    it('appends data.', () => {
      const { primary, replica } = testComment('test')
      primary.appendData('data')
      expect(replica.data).toBe('testdata')
    })
  })

  describe('deleteData()', () => {
    it('deletes data.', () => {
      const { primary, replica } = testComment('test')
      primary.deleteData(2, 1)
      expect(replica.data).toBe('tet')
    })
  })

  describe('insertData()', () => {
    it('inserts data.', () => {
      const { primary, replica } = testComment('test')
      primary.insertData(2, 's')
      expect(replica.data).toBe('tesst')
    })
  })

  describe('replaceData()', () => {
    it('replaces data.', () => {
      const { primary, replica } = testComment('test')
      primary.replaceData(2, 1, 'z')
      expect(replica.data).toBe('tezt')
    })
  })

  describe('remove()', () => {
    it('removes the node from its parent.', () => {
      const { primary, replica } = testComment('test')
      primary.remove()
      expect(replica.parentNode).toBe(null)
    })
  })

  describe('replaceWith()', () => {
    it('replaces a Node in the children list of its parent with a set of Node or DOMString objects.', () => {
      const { primary, replica } = testComment('test')
      const node1 = document.createComment('test1')
      const node2 = document.createComment('test2')

      primary.replaceWith(node1, node2)

      expect(primary.ownerDocument.body.innerHTML).toBe('<!--test1--><!--test2-->')
      expect(replica.ownerDocument.body.innerHTML).toBe('<!--test1--><!--test2-->')
    })
  })

  describe('before()', () => {
    it('inserts a set of Node or DOMString objects in the children list of this ChildNode\'s parent, just before this ChildNode. DOMString objects are inserted as equivalent Text nodes.', () => {
      const { primary, replica } = testComment('test')
      const node1 = document.createComment('test1')
      const node2 = document.createComment('test2')

      primary.before(node1, node2)

      expect(primary.ownerDocument.body.innerHTML).toBe('<!--test1--><!--test2--><!--test-->')
      expect(replica.ownerDocument.body.innerHTML).toBe('<!--test1--><!--test2--><!--test-->')
    })
  })

  describe('after()', () => {
    it('inserts a set of Node or DOMString objects in the children list of this ChildNode\'s parent, just after this ChildNode. DOMString objects are inserted as equivalent Text nodes.', () => {
      const { primary, replica } = testComment('test')
      const node1 = document.createComment('test1')
      const node2 = document.createComment('test2')

      primary.after(node1, node2)

      expect(primary.ownerDocument.body.innerHTML).toBe('<!--test--><!--test1--><!--test2-->')
      expect(replica.ownerDocument.body.innerHTML).toBe('<!--test--><!--test1--><!--test2-->')
    })
  })

  describe('cloneNode()', () => {
    it('clones the node.', () => {
      const { primary, replica } = testComment('test')
      const clone = primary.cloneNode()
      expect(clone.textContent).toBe('test')
      expect(primary.ownerDocument.body.innerHTML).toBe('<!--test-->')
      expect(replica.ownerDocument.body.innerHTML).toBe('<!--test-->')
    })
  })
})
