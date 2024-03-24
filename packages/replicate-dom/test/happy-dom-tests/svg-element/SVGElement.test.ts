/*
  This file is derived from:
  https://github.com/capricorn86/happy-dom/blob/6cbcc10a1a227b36e38a7bc33203b2ae029cca95/packages/happy-dom/test/nodes/svg-element/SVGElement.test.ts ,
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
import { Window } from 'happy-dom'
import type { Document, HTMLElement, ISVGElement, ISVGSVGElement } from 'happy-dom'
import NamespaceURI from '../../../node_modules/happy-dom/lib/config/NamespaceURI'
import HTMLElementUtility from '../../../node_modules/happy-dom/lib/nodes/html-element/HTMLElementUtility'
import { initTestReplicaDom } from '../../test-setup'
import { serializeDomNode } from '../../../src'

describe('sVGElement', () => {
  let window: Window
  let document: Document

  let replicaWindow: Window
  let replicaDocument: Document

  let element: ISVGSVGElement
  let line: ISVGElement

  afterEach(() => {
    expect(replicaDocument.body.outerHTML).toBe(document.body.outerHTML)

    const primarySerialized = serializeDomNode(document.body, window)
    const replicaSerialized = serializeDomNode(replicaDocument.body, replicaWindow)
    expect(replicaSerialized).toEqual(primarySerialized)
  })

  beforeEach(() => {
    window = new Window()
    document = window.document

    replicaWindow = new Window()
    replicaDocument = replicaWindow.document

    initTestReplicaDom(window, replicaWindow)

    element = <ISVGSVGElement>document.createElementNS(NamespaceURI.svg, 'svg')
    line = <ISVGElement>document.createElementNS(NamespaceURI.svg, 'line')

    document.body.appendChild(element)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  function replicaElement() {
    return replicaDocument.body.childNodes
      .find(node => Reflect.get(node, 'tagName') === 'svg') as ISVGSVGElement
  }
  function replicaLine() {
    return replicaElement()?.children.find(node => Reflect.get(node, 'tagName') === 'line') as ISVGElement
  }

  describe('get ownerSVGElement()', () => {
    it('returns svg element when append to some svg.', () => {
      element.append(line)
      const ownerSVG = line.ownerSVGElement
      expect(ownerSVG).toBe(element)
      expect(replicaLine().ownerSVGElement).toBe(replicaElement())
    })

    it('returns null when dangling.', () => {
      const ownerSVG = line.ownerSVGElement
      expect(ownerSVG).toBe(null)
    })
  })

  describe('get dataset()', () => {
    it('returns a Proxy behaving like an object that can add, remove, set and get element attributes prefixed with "data-".', () => {
      element.setAttribute('test-alpha', 'value1')
      element.setAttribute('data-test-alpha', 'value2')
      element.setAttribute('test-beta', 'value3')
      element.setAttribute('data-test-beta', 'value4')

      const dataset = element.dataset

      expect(replicaElement().dataset).toEqual(element.dataset)
      expect(Object.keys(replicaElement().dataset)).toEqual(['testAlpha', 'testBeta'])
      expect(Object.values(replicaElement().dataset)).toEqual(['value2', 'value4'])

      dataset.testGamma = 'value5'

      expect(replicaElement().getAttribute('data-test-gamma')).toBe('value5')
      expect(Object.keys(replicaElement().dataset)).toEqual(['testAlpha', 'testBeta', 'testGamma'])
      expect(Object.values(replicaElement().dataset)).toEqual(['value2', 'value4', 'value5'])

      element.setAttribute('data-test-delta', 'value6')

      expect(replicaElement().dataset.testDelta).toBe('value6')
      expect(Object.keys(replicaElement().dataset)).toEqual(['testAlpha', 'testBeta', 'testGamma', 'testDelta'])
      expect(Object.values(replicaElement().dataset)).toEqual(['value2', 'value4', 'value5', 'value6'])

      delete dataset.testDelta

      expect(replicaElement().getAttribute('data-test-delta')).toBe(null)
      expect(Object.keys(replicaElement().dataset)).toEqual(['testAlpha', 'testBeta', 'testGamma'])
      expect(Object.values(replicaElement().dataset)).toEqual(['value2', 'value4', 'value5'])
    })
  })

  describe('get tabIndex()', () => {
    it('returns the attribute "tabindex" as a number.', () => {
      element.setAttribute('tabindex', '5')
      expect(element.tabIndex).toBe(5)
    })
  })

  describe('set tabIndex()', () => {
    it('sets the attribute "tabindex".', () => {
      element.tabIndex = 5
      expect(element.getAttribute('tabindex')).toBe('5')
    })

    it('removes the attribute "tabindex" when set to "-1".', () => {
      element.tabIndex = 5
      element.tabIndex = -1
      expect(element.getAttribute('tabindex')).toBe(null)
    })
  })

  describe('blur()', () => {
    it('calls HTMLElementUtility.blur().', () => {
      let blurredElement: ISVGElement | null = null

      vi.spyOn(HTMLElementUtility, 'blur').mockImplementation(
        (element: ISVGElement | HTMLElement) => {
          blurredElement = <ISVGElement>element
        },
      )

      element.blur()

      expect(blurredElement === element).toBe(true)
    })
  })

  describe('focus()', () => {
    it('calls HTMLElementUtility.focus().', () => {
      let focusedElement: ISVGElement | null = null

      vi.spyOn(HTMLElementUtility, 'focus').mockImplementation(
        (element: ISVGElement | HTMLElement) => {
          focusedElement = <ISVGElement>element
        },
      )

      element.focus()

      expect(focusedElement === element).toBe(true)
    })
  })
})
