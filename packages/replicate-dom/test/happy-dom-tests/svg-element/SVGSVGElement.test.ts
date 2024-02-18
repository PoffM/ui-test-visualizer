/*
  This file is derived from:
  https://github.com/capricorn86/happy-dom/blob/6cbcc10a1a227b36e38a7bc33203b2ae029cca95/packages/happy-dom/test/nodes/svg-element/SVGSVGElement.test.ts ,
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
import type { IDocument, ISVGSVGElement, IWindow } from 'happy-dom'
import { Window } from 'happy-dom'
import SVGTransform from '../../../node_modules/happy-dom/lib/nodes/svg-element/SVGTransform'
import SVGRect from '../../../node_modules/happy-dom/lib/nodes/svg-element/SVGRect'
import SVGPoint from '../../../node_modules/happy-dom/lib/nodes/svg-element/SVGPoint'
import SVGAngle from '../../../node_modules/happy-dom/lib/nodes/svg-element/SVGAngle'
import SVGNumber from '../../../node_modules/happy-dom/lib/nodes/svg-element/SVGNumber'
import SVGLength from '../../../node_modules/happy-dom/lib/nodes/svg-element/SVGLength'
import { initTestReplicaDom } from '../../test-setup'
import NamespaceURI from '../../../node_modules/happy-dom/lib/config/NamespaceURI'
import SVGAnimatedRect from '../../../node_modules/happy-dom/lib/nodes/svg-element/SVGAnimatedRect'

describe('sVGSVGElement', () => {
  let window: IWindow
  let document: IDocument

  let replicaWindow: IWindow
  let replicaDocument: IDocument

  let element: ISVGSVGElement

  afterEach(() => {
    expect(replicaDocument.body.outerHTML).toBe(document.body.outerHTML)
  })

  beforeEach(() => {
    window = new Window()
    document = window.document

    replicaWindow = new Window()
    replicaDocument = replicaWindow.document

    initTestReplicaDom(window, replicaWindow)

    element = <ISVGSVGElement>document.createElementNS(NamespaceURI.svg, 'svg')

    document.body.appendChild(element)
  })

  function replicaElement() {
    return replicaDocument.querySelector('svg') as ISVGSVGElement
  }

  for (const property of ['width', 'height', 'x', 'y', 'contentScriptType']) {
    describe(`get ${property}()`, () => {
      it('returns attribute value.', () => {
        // @ts-expect-error property should exist
        expect(replicaElement()[property]).toBe('')
        element.setAttribute(property, 'value')
        // @ts-expect-error property should exist
        expect(replicaElement()[property]).toBe('value')
      })
    })

    describe(`set ${property}()`, () => {
      it('sets attribute value.', () => {
        // @ts-expect-error property should exist
        element[property] = 'value'
        expect(replicaElement().getAttribute(property)).toBe('value')
      })
    })
  }

  describe('get preserveAspectRatio()', () => {
    it('returns attribute value.', () => {
      expect(replicaElement().preserveAspectRatio).toBe('xMidYMid meet')
      element.setAttribute('preserveAspectRatio', 'xMidYMin')
      expect(replicaElement().preserveAspectRatio).toBe('xMidYMin')
    })
  })

  describe('set preserveAspectRatio()', () => {
    it('sets attribute value.', () => {
      element.preserveAspectRatio = 'xMidYMin'
      expect(replicaElement().getAttribute('preserveAspectRatio')).toBe('xMidYMin')
    })
  })

  describe('get currentScale()', () => {
    it('returns attribute value.', () => {
      expect(element.currentScale).toBe(1)
      element.currentScale = 2
      expect(replicaElement().currentScale).toBe(2)
    })
  })

  describe('set currentScale()', () => {
    it('sets attribute value.', () => {
      element.setAttribute('currentScale', '2')
      expect(replicaElement().currentScale).toBe(2)
      element.currentScale = 3
      expect(replicaElement().currentScale).toBe(3)
      expect(replicaElement().getAttribute('currentScale')).toBe('3')
    })
  })

  describe('get viewport()', () => {
    it('returns an instanceof SVGRect.', () => {
      expect(replicaElement().viewport instanceof SVGRect).toBe(true)
    })
  })

  describe('get currentTranslate()', () => {
    it('returns an instanceof SVGPoint.', () => {
      expect(replicaElement().currentTranslate instanceof SVGPoint).toBe(true)
    })
  })

  describe('get viewBox()', () => {
    it('returns an instanceof SVGAnimatedRect with values from the attribute "viewBox".', () => {
      element.setAttribute('viewBox', '0 0 100 100')
      expect(replicaElement().viewBox instanceof SVGAnimatedRect).toBe(true)
      expect(replicaElement().viewBox.baseVal).toEqual({
        x: 0,
        y: 0,
        width: 100,
        height: 100,
      })
    })
  })

  describe('pauseAnimations()', () => {
    it('exists and does nothing.', () => {
      expect(typeof replicaElement().pauseAnimations).toBe('function')
      element.pauseAnimations()
    })
  })

  describe('unpauseAnimations()', () => {
    it('exists and does nothing.', () => {
      expect(typeof replicaElement().unpauseAnimations).toBe('function')
      element.unpauseAnimations()
    })
  })

  describe('getCurrentTime()', () => {
    it('returns "0".', () => {
      expect(replicaElement().getCurrentTime()).toBe(0)
    })
  })

  describe('setCurrentTime()', () => {
    it('exists and does nothing.', () => {
      expect(typeof replicaElement().setCurrentTime).toBe('function')
      element.setCurrentTime()
    })
  })

  describe('getIntersectionList()', () => {
    it('returns an empty Array.', () => {
      expect(replicaElement().getIntersectionList()).toEqual([])
    })
  })

  describe('getEnclosureList()', () => {
    it('returns an empty Array.', () => {
      expect(replicaElement().getEnclosureList()).toEqual([])
    })
  })

  describe('checkIntersection()', () => {
    it('returns "false".', () => {
      expect(replicaElement().checkIntersection()).toBe(false)
    })
  })

  describe('checkEnclosure()', () => {
    it('returns "false".', () => {
      expect(replicaElement().checkEnclosure()).toBe(false)
    })
  })

  describe('deselectAll()', () => {
    it('exists and does nothing.', () => {
      expect(typeof replicaElement().deselectAll).toBe('function')
      element.deselectAll()
    })
  })

  describe('createSVGNumber()', () => {
    it('returns an instance of SVGNumber.', () => {
      expect(replicaElement().createSVGNumber() instanceof SVGNumber).toBe(true)
    })
  })

  describe('createSVGLength()', () => {
    it('returns an instance of SVGLength.', () => {
      expect(replicaElement().createSVGLength() instanceof SVGLength).toBe(true)
    })
  })

  describe('createSVGAngle()', () => {
    it('returns an instance of SVGAngle.', () => {
      expect(replicaElement().createSVGAngle() instanceof SVGAngle).toBe(true)
    })
  })

  describe('createSVGPoint()', () => {
    it('returns an instance of SVGPoint.', () => {
      expect(replicaElement().createSVGPoint() instanceof SVGPoint).toBe(true)
    })
  })

  describe('createSVGRect()', () => {
    it('returns an instance of SVGRect.', () => {
      expect(replicaElement().createSVGRect() instanceof SVGRect).toBe(true)
    })
  })

  describe('createSVGTransform()', () => {
    it('returns an instance of SVGTransform.', () => {
      expect(replicaElement().createSVGTransform() instanceof SVGTransform).toBe(true)
    })
  })

  describe('get style()', () => {
    it('returns styles.', () => {
      element.setAttribute('style', 'border-radius: 2px; padding: 2px;')
      expect(replicaElement().style.length).toEqual(8)
      expect(replicaElement().style[0]).toEqual('border-top-left-radius')
      expect(replicaElement().style[1]).toEqual('border-top-right-radius')
      expect(replicaElement().style[2]).toEqual('border-bottom-right-radius')
      expect(replicaElement().style[3]).toEqual('border-bottom-left-radius')
      expect(replicaElement().style[4]).toEqual('padding-top')
      expect(replicaElement().style[5]).toEqual('padding-right')
      expect(replicaElement().style[6]).toEqual('padding-bottom')
      expect(replicaElement().style[7]).toEqual('padding-left')
      expect(replicaElement().style.borderRadius).toEqual('2px')
      expect(replicaElement().style.padding).toEqual('2px')
      expect(replicaElement().style.cssText).toEqual('border-radius: 2px; padding: 2px;')

      element.setAttribute('style', 'border-radius: 4px; padding: 4px;')
      expect(replicaElement().style.length).toEqual(8)
      expect(replicaElement().style[0]).toEqual('border-top-left-radius')
      expect(replicaElement().style[1]).toEqual('border-top-right-radius')
      expect(replicaElement().style[2]).toEqual('border-bottom-right-radius')
      expect(replicaElement().style[3]).toEqual('border-bottom-left-radius')
      expect(replicaElement().style[4]).toEqual('padding-top')
      expect(replicaElement().style[5]).toEqual('padding-right')
      expect(replicaElement().style[6]).toEqual('padding-bottom')
      expect(replicaElement().style[7]).toEqual('padding-left')
      expect(replicaElement().style.borderRadius).toEqual('4px')
      expect(replicaElement().style.padding).toEqual('4px')
      expect(replicaElement().style.cssText).toEqual('border-radius: 4px; padding: 4px;')
    })
  })
  describe('removeAttributeNode()', () => {
    it('removes property from CSSStyleDeclaration.', () => {
      element.style.background = 'green'
      element.style.color = 'black'
      element.removeAttribute('style')
      expect(replicaElement().style.length).toEqual(0)
      expect(replicaElement().style.cssText).toEqual('')
    })
  })
})
