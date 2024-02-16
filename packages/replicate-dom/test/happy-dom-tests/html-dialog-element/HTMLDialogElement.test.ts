/*
  This file is derived from:
  https://github.com/capricorn86/happy-dom/blob/6cbcc10a1a227b36e38a7bc33203b2ae029cca95/packages/happy-dom/test/nodes/html-dialog-element/HTMLDialogElement.test.ts ,
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
import type { IDocument, IHTMLDialogElement, IWindow } from 'happy-dom'
import { addTestElement, initTestReplicaDom } from '../../test-setup'

describe('hTMLDialogElement', () => {
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
    expect(replicaDocument.body?.outerHTML).toBe(document.body?.outerHTML)
  })

  function testElement(type: string) {
    return addTestElement(
      document,
      replicaDocument,
      type,
      'createElement',
    ) as {
      primary: IHTMLDialogElement
      replica: IHTMLDialogElement
    }
  }

  describe('set open()', () => {
    it('should set the open state', () => {
      const { primary, replica } = testElement('dialog')
      primary.open = true
      expect(replica.open).toBe(true)
      primary.open = false
      expect(replica.open).toBe(false)
    })
  })

  describe('get open()', () => {
    it('should be closed by default', () => {
      const { replica } = testElement('dialog')
      expect(replica.open).toBe(false)
    })

    it('should be open when show has been called', () => {
      const { primary, replica } = testElement('dialog')
      primary.show()
      expect(replica.open).toBe(true)
    })

    it('should be open when showModal has been called', () => {
      const { primary, replica } = testElement('dialog')
      primary.showModal()
      expect(replica.open).toBe(true)
    })
  })

  describe('get returnValue()', () => {
    it('should be empty string by default', () => {
      const { replica } = testElement('dialog')
      expect(replica.returnValue).toBe('')
    })

    it('should be set when close has been called with a return value', () => {
      const { primary, replica } = testElement('dialog')
      primary.close('foo')
      expect(replica.returnValue).toBe('foo')
    })
  })

  describe('set returnValue()', () => {
    it('should be possible to set manually', () => {
      const { primary, replica } = testElement('dialog')
      primary.returnValue = 'foo'
      expect(replica.returnValue).toBe('foo')
    })
  })

  describe('close()', () => {
    it('should be possible to close an open dialog', () => {
      const { primary, replica } = testElement('dialog')
      primary.show()
      primary.close()
      expect(replica.open).toBe(false)
      expect(replica.getAttribute('open')).toBe(null)
    })

    it('should be possible to close an open modal dialog', () => {
      const { primary, replica } = testElement('dialog')
      primary.showModal()
      primary.close()
      expect(replica.open).toBe(false)
      expect(replica.getAttribute('open')).toBe(null)
    })

    it('should be possible to close the dialog with a return value', () => {
      const { primary, replica } = testElement('dialog')
      primary.show()
      primary.close('foo')
      expect(replica.returnValue).toBe('foo')
    })

    it('should be possible to close the modal dialog with a return value', () => {
      const { primary, replica } = testElement('dialog')
      primary.showModal()
      primary.close('foo')
      expect(replica.returnValue).toBe('foo')
    })
  })

  describe('showModal()', () => {
    it('should be possible to show a modal dialog', () => {
      const { primary, replica } = testElement('dialog')
      primary.showModal()
      expect(replica.open).toBe(true)
      expect(replica.getAttributeNS(null, 'open')).toBe('')
    })
  })

  describe('show()', () => {
    it('should be possible to show a dialog', () => {
      const { primary, replica } = testElement('dialog')
      primary.show()
      expect(replica.open).toBe(true)
      expect(replica.getAttributeNS(null, 'open')).toBe('')
    })
  })
})
