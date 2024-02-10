import { beforeEach, describe, expect, it } from 'vitest'
import type { Document } from 'happy-dom'
import { Text, Window } from 'happy-dom'
import { addTestElement, initTestReplicaDom } from '../test-setup.js'

describe('text', () => {
  let window: Window
  let document: Document

  let replicaWindow: Window
  let replicaDocument: Document

  beforeEach(() => {
    window = new Window()
    document = window.document

    replicaWindow = new Window()
    replicaDocument = replicaWindow.document

    initTestReplicaDom(window, replicaDocument)
  })

  function testElement(arg: string) {
    return addTestElement(
      document,
      replicaDocument,
      arg,
      'createTextNode',
    )
  }

  describe('get nodeName()', () => {
    it('returns "#text".', () => {
      const { replica } = testElement('test')
      expect(replica).toBeInstanceOf(Text)
      expect(replica.nodeName).toBe('#text')
    })
  })

  describe('toString()', () => {
    it('returns "[object Text]".', () => {
      const { replica } = testElement('test')
      expect(replica.toString()).toBe('[object Text]')
    })
  })

  describe('splitText()', () => {
    it('splits the text node.', () => {
      const { primary, replica } = testElement('test')
      const primaryResult = primary.splitText(2)
      expect(replica.textContent).toBe('te')
      expect(primaryResult).toBeInstanceOf(Text)
      expect(primaryResult.textContent).toBe('st')
      expect((replica.nextSibling as unknown as Text).data).toBe(primaryResult.data)
      expect((primaryResult.previousSibling as unknown as Text).data).toBe(primary.data)
    })
  })
})
