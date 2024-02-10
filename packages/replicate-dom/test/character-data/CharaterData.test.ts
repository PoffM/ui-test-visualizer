import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { IDocument, IWindow } from 'happy-dom'
import { Window } from 'happy-dom'
import { addTestElement, initTestReplicaDom } from '../test-setup.js'

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

      // @ts-expect-error should work
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

      // @ts-expect-error should work
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

      // @ts-expect-error should work
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
