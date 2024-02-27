/*
  This file is derived from:
  https://github.com/capricorn86/happy-dom/blob/6cbcc10a1a227b36e38a7bc33203b2ae029cca95/packages/happy-dom/test/nodes/html-form-element/HTMLFormElement.test.ts ,
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
import { type IDocument, type IHTMLFormElement, type IWindow, Window } from 'happy-dom'
import { addTestElement, initTestReplicaDom } from '../../test-setup.js'
import { serializeDomNode } from '../../../src/index.js'

describe('hTMLFormElement', () => {
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
      primary: IHTMLFormElement
      replica: IHTMLFormElement
    }
  }

  for (const property of [
    'name',
    'target',
    'action',
    'encoding',
    'enctype',
    'acceptCharset',
    'autocomplete',
  ]) {
    describe(`get ${property}()`, () => {
      it('returns attribute value.', () => {
        const { primary, replica } = testElement('form')
        // @ts-expect-error property should exist
        expect(replica[property]).toBe('')
        primary.setAttribute(property, 'value')
        // @ts-expect-error property should exist
        expect(replica[property]).toBe('value')
      })
    })

    describe(`set ${property}()`, () => {
      it('sets attribute value.', () => {
        const { primary, replica } = testElement('form')
        // @ts-expect-error property should exist
        primary[property] = 'value'
        expect(replica.getAttribute(property)).toBe('value')
      })
    })
  }

  describe('get noValidate()', () => {
    it('returns "true" if defined.', () => {
      const { primary, replica } = testElement('form')
      expect(replica.noValidate).toBe(false)
      primary.setAttribute('novalidate', '')
      expect(replica.noValidate).toBe(true)
    })
  })

  describe('set noValidate()', () => {
    it('sets attribute value.', () => {
      const { primary, replica } = testElement('form')
      primary.noValidate = true
      expect(replica.getAttribute('novalidate')).toBe('')
    })
  })

  describe('get method()', () => {
    it('returns attribute value.', () => {
      const { primary, replica } = testElement('form')
      expect(replica.method).toBe('get')
      primary.setAttribute('method', 'post')
      expect(replica.method).toBe('post')
    })
  })

  describe('set method()', () => {
    it('sets attribute value.', () => {
      const { primary, replica } = testElement('form')
      primary.method = 'post'
      expect(replica.getAttribute('method')).toBe('post')
    })
  })

  describe('get elements()', () => {
    it('replicates html.', () => {
      const { primary, replica } = testElement('form')
      primary.innerHTML = `
                <div>
                    <input type="text" name="text1" value="value1">
					<button name="button1" value="value1"></button>
                    <input type="checkbox" name="checkbox1" value="value1">
                    <input type="checkbox" name="checkbox1" value="value2" checked>
                    <input type="checkbox" name="checkbox1" value="value3">
                    <input type="radio" name="radio1" value="value1">
                    <input type="radio" name="radio1" value="value2" checked>
                    <input type="radio" name="radio1" value="value3">
                    <input type="hidden" name="1" value="value1">
                </div>
            `
      expect(replica.innerHTML).toBe(primary.innerHTML)
    })

    it('replicates html. 2', () => {
      const { primary, replica } = testElement('form')
      primary.innerHTML = `
                <div>
                    <input type="text" name="length" value="value1">
                    <input type="checkbox" name="namedItem" value="value1">
                    <input type="checkbox" name="namedItem" value="value2" checked>
                    <input type="checkbox" name="namedItem" value="value3">
                    <input type="hidden" name="push" value="value1">
                </div>
            `
      expect(replica.innerHTML).toBe(primary.innerHTML)
    })
  })

  describe('submit()', () => {
    it('does nothing.', () => {
      const { primary } = testElement('form')
      primary.submit()
    })
  })

  describe('reset()', () => {
    it('resets the form.', () => {
      const { primary, replica } = testElement('form')
      primary.innerHTML = `
                <div>
                    <input type="text" name="text1" value="Default value">
                    <select>
                        <option value="value1"></option>
                        <option value="value2" selected></option>
                        <option value="value3"></option>
                    </select>
                    <textarea name="textarea1">Default value</textarea>
                    <input type="checkbox" name="checkbox1" value="value1">
                    <input type="checkbox" name="checkbox1" value="value2" checked>
                    <input type="checkbox" name="checkbox1" value="value3">
                    <input type="radio" name="radio1" value="value1">
                    <input type="radio" name="radio1" value="value2" checked>
                    <input type="radio" name="radio1" value="value3">
                </div>
            `

      expect(replica.innerHTML).toBe(primary.innerHTML)

      primary.reset()

      expect(replica.innerHTML).toBe(primary.innerHTML)
    })
  })
})
