/*
  This file is derived from:
  https://github.com/capricorn86/happy-dom/blob/6cbcc10a1a227b36e38a7bc33203b2ae029cca95/packages/happy-dom/test/nodes/text/Text.test.ts ,
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

import { beforeEach, describe, expect, it } from 'vitest'
import type { Document } from 'happy-dom'
import { Text, Window } from 'happy-dom'
import { addTestElement, initTestReplicaDom } from '../../test-setup.js'

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
