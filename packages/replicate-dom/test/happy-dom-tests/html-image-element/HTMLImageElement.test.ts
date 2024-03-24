/*
  This file is derived from:
  https://github.com/capricorn86/happy-dom/blob/6cbcc10a1a227b36e38a7bc33203b2ae029cca95/packages/happy-dom/test/nodes/html-image-element/HTMLImageElement.test.ts ,
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
import type { Document, IHTMLImageElement, Window } from 'happy-dom'
import { addTestElement, initTestReplicaDom } from '../../test-setup'
import { serializeDomNode } from '../../../src'

describe('hTMLImageElement', () => {
  let window: Window
  let document: Document

  let replicaWindow: Window
  let replicaDocument: Document

  beforeEach(() => {
    window = new Window()
    document = window.document

    replicaWindow = new Window()
    replicaDocument = replicaWindow.document

    initTestReplicaDom(window, replicaWindow)
  })

  afterEach(() => {
    expect(replicaDocument.body.outerHTML).toBe(document.body.outerHTML)

    const primarySerialized = serializeDomNode(document.body, window)
    const replicaSerialized = serializeDomNode(replicaDocument.body, replicaWindow)
    expect(replicaSerialized).toEqual(primarySerialized)
  })

  function testElement(type: string) {
    return addTestElement(
      document,
      replicaDocument,
      type,
      'createElement',
    ) as {
      primary: IHTMLImageElement
      replica: IHTMLImageElement
    }
  }

  describe('object.prototype.toString', () => {
    it('returns `[object HTMLImageElement]`', () => {
      const element = document.createElement('img')
      expect(Object.prototype.toString.call(element)).toBe('[object HTMLImageElement]')
    })
  })

  for (const property of ['alt', 'referrerPolicy', 'sizes', 'src', 'srcset', 'useMap']) {
    describe(`get ${property}()`, () => {
      it(`returns the "`, () => {
        const { primary, replica } = testElement('img')
        primary.setAttribute(property, 'test')
        // @ts-expect-error property should exist
        expect(replica[property]).toBe('test')
      })
    })

    describe(`set ${property}()`, () => {
      it(`sets the attribute "`, () => {
        const { primary, replica } = testElement('img')
        // @ts-expect-error property should exist
        primary[property] = 'test'
        expect(replica.getAttribute(property)).toBe('test')
      })
    })
  }

  for (const property of ['height', 'width']) {
    describe(`get ${property}()`, () => {
      it(`returns the "`, () => {
        const { primary, replica } = testElement('img')
        primary.setAttribute(property, '100')
        // @ts-expect-error property should exist
        expect(replica[property]).toBe(100)
      })
    })

    describe(`set ${property}()`, () => {
      it(`sets the attribute "`, () => {
        const { primary, replica } = testElement('img')
        // @ts-expect-error property should exist
        primary[property] = 100
        expect(replica.getAttribute(property)).toBe('100')
      })
    })
  }

  for (const property of ['isMap']) {
    describe(`get ${property}()`, () => {
      it(`returns "true" if the "`, () => {
        const { primary, replica } = testElement('img')
        primary.setAttribute(property, '')
        // @ts-expect-error property should exist
        expect(replica[property]).toBe(true)
      })
    })

    describe(`set ${property}()`, () => {
      it(`sets the "`, () => {
        const { primary, replica } = testElement('img')
        // @ts-expect-error property should exist
        primary[property] = true
        expect(replica.getAttribute(property)).toBe('')
      })
    })
  }

  describe('get complete()', () => {
    it('returns "false".', () => {
      const { replica } = testElement('img')
      expect(replica.complete).toBe(false)
    })
  })

  describe('get naturalHeight()', () => {
    it('returns "0".', () => {
      const { replica } = testElement('img')
      expect(replica.naturalHeight).toBe(0)
    })
  })

  describe('get naturalWidth()', () => {
    it('returns "0".', () => {
      const { replica } = testElement('img')
      expect(replica.naturalWidth).toBe(0)
    })
  })

  describe('get crossOrigin()', () => {
    it('returns "null".', () => {
      const { replica } = testElement('img')
      expect(replica.crossOrigin).toBe(null)
    })
  })

  describe('get decoding()', () => {
    it('returns "auto".', () => {
      const { replica } = testElement('img')
      expect(replica.decoding).toBe('auto')
    })
  })

  describe('get loading()', () => {
    it('returns "auto".', () => {
      const { replica } = testElement('img')
      expect(replica.loading).toBe('auto')
    })
  })

  describe('get x()', () => {
    it('returns "0".', () => {
      const { replica } = testElement('img')
      expect(replica.x).toBe(0)
    })
  })

  describe('get y()', () => {
    it('returns "0".', () => {
      const { replica } = testElement('img')
      expect(replica.y).toBe(0)
    })
  })

  describe('decode()', () => {
    it('executes a promise.', async () => {
      const { replica } = testElement('img')
      await replica.decode()
    })
  })
})
