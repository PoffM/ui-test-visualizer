import { beforeEach, describe, expect, it } from 'vitest'
import { Window } from 'happy-dom'
import type { IDocument, IWindow } from 'happy-dom'
import { addTestElement, initTestReplicaDom } from '../test-setup'

describe('comment', () => {
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

  describe('get nodeName()', () => {
    it('returns "#comment".', () => {
      const { primary, replica } = testComment('test')
      expect(primary.nodeName).toBe('#comment')
      expect(replica.nodeName).toBe('#comment')
    })
  })

  describe('toString()', () => {
    it('returns "[object Comment]".', () => {
      const { replica } = testComment('test')
      expect(replica.toString()).toBe('[object Comment]')
    })
  })
})
