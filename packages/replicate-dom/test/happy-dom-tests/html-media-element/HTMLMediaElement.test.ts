/*
  This file is derived from:
  https://github.com/capricorn86/happy-dom/blob/6cbcc10a1a227b36e38a7bc33203b2ae029cca95/packages/happy-dom/test/nodes/html-media-element/HTMLMediaElement.test.ts ,
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
import { type IDocument, type IHTMLMediaElement, type IWindow, Window } from 'happy-dom'
import { addTestElement, initTestReplicaDom } from '../../test-setup.js'

describe('hTMLMediaElement', () => {
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
    expect(replicaDocument.body.outerHTML).toBe(document.body.outerHTML)
  })

  function testElement(type: string) {
    return addTestElement<IHTMLMediaElement>(
      document,
      replicaDocument,
      type,
      'createElement',
    )
  }

  describe('object.prototype.toString', () => {
    it('returns `[object HTMLAudioElement]`', () => {
      const { replica } = testElement('audio')
      expect(Object.prototype.toString.call(replica)).toBe('[object HTMLAudioElement]')
    })
  })

  for (const property of ['autoplay', 'controls', 'loop']) {
    describe(`get ${property}()`, () => {
      it('returns attribute value.', () => {
        const { primary, replica } = testElement('audio')
        // @ts-expect-error property should exist
        expect(replica[property]).toBe(false)
        primary.setAttribute(property, '')
        // @ts-expect-error property should exist
        expect(replica[property]).toBe(true)
      })
    })

    describe(`set ${property}()`, () => {
      it('sets attribute value.', () => {
        const { primary, replica } = testElement('audio')
        // @ts-expect-error property should exist
        primary[property] = true
        expect(replica.getAttribute(property)).toBe('')
      })

      it('remove attribute value.', () => {
        const { primary, replica } = testElement('audio')
        primary.setAttribute(property, '')
        // @ts-expect-error property should exist
        primary[property] = false
        expect(replica.getAttribute(property)).toBeNull()
      })
    })
  }

  for (const property of ['src', 'preload']) {
    describe(`get ${property}()`, () => {
      it(`returns the "`, () => {
        const { primary, replica } = testElement('audio')
        primary.setAttribute(property, 'test')
        // @ts-expect-error property should exist
        expect(replica[property]).toBe('test')
      })
    })

    describe(`set ${property}()`, () => {
      it(`sets the attribute "`, () => {
        const { primary, replica } = testElement('audio')
        // @ts-expect-error property should exist
        primary[property] = 'test'
        expect(replica.getAttribute(property)).toBe('test')
      })
    })
  }

  describe(`get defaultMuted()`, () => {
    it('returns value.', () => {
      const { primary, replica } = testElement('audio')
      expect(replica.defaultMuted).toBe(false)
      primary.defaultMuted = true
      expect(replica.defaultMuted).toBe(true)
    })
  })

  describe(`set defaultMuted()`, () => {
    it('sets attribute value.', () => {
      const { primary, replica } = testElement('audio')
      primary.defaultMuted = true
      expect(replica.getAttribute('muted')).toBe('')
    })

    it('remove attribute value.', () => {
      const { primary, replica } = testElement('audio')
      primary.defaultMuted = true
      primary.defaultMuted = false
      expect(replica.getAttribute('muted')).toBeNull()
    })
  })

  describe(`get muted()`, () => {
    it('returns value.', () => {
      const { primary, replica } = testElement('audio')
      primary.setAttribute('muted', '')
      expect(replica.muted).toBe(true)
    })
    it('returns setter value.', () => {
      const { primary, replica } = testElement('audio')
      primary.muted = true
      expect(replica.muted).toBe(true)
    })
  })

  describe(`set muted()`, () => {
    it('sets attribute value.', () => {
      const { primary, replica } = testElement('audio')
      primary.muted = true
      expect(replica.getAttribute('muted')).toBe('')
    })

    it('remove attribute value.', () => {
      const { primary, replica } = testElement('audio')
      primary.setAttribute('muted', '')
      primary.muted = false
      expect(replica.getAttribute('muted')).toBeNull()
    })

    it('keep attribute value, if default muted true', () => {
      const { primary, replica } = testElement('audio')
      primary.setAttribute('muted', '')
      primary.defaultMuted = true
      primary.muted = false
      expect(replica.getAttribute('muted')).toBe('')
      expect(replica.muted).toBe(false)
    })
  })

  describe('currentSrc', () => {
    it('returns the current src', () => {
      const { primary, replica } = testElement('audio')
      const src = 'https://src'
      primary.src = src
      expect(replica.currentSrc).toBe(src)
    })
  })

  describe('paused', () => {
    it('default is true', () => {
      const { replica } = testElement('audio')
      expect(replica.paused).toBeTruthy()
    })

    it('set false with play', () => {
      const { primary, replica } = testElement('audio')
      primary.play()
      expect(replica.paused).toBeFalsy()
    })

    it('set true with pause', () => {
      const { primary, replica } = testElement('audio')
      primary.play()
      primary.pause()
      expect(replica.paused).toBeTruthy()
    })
  })

  describe('volume()', () => {
    it('returns default value', () => {
      const { replica } = testElement('audio')
      expect(replica.volume).toBe(1)
    })

    it('set value', () => {
      const { primary, replica } = testElement('audio')
      primary.volume = 0.5
      expect(replica.volume).toBe(0.5)
    })

    it('set parse volmue as a number', () => {
      const { primary, replica } = testElement('audio')
      primary.volume = '0.5'
      expect(replica.volume).toBe(0.5)
    })

    it('throw type error if volume is not a number', () => {
      const { primary } = testElement('audio')
      expect(() => {
        primary.volume = 'zeropointfive'
      }).toThrowError(
        new TypeError(
					`Failed to set the 'volume' property on 'HTMLMediaElement': The provided double value is non-finite.`,
        ),
      )
    })

    for (const volume of [-0.4, 1.3]) {
      it(`throw error if out of range: `, () => {
        const { primary } = testElement('audio')
        expect(() => {
          primary.volume = volume
        }).toThrowError(
          new DOMException(
						`Failed to set the 'volume' property on 'HTMLMediaElement': The volume provided (${volume}) is outside the range [0, 1].`,
						'indexSizeError',
          ),
        )
      })
    }
  })

  describe('canPlayType', () => {
    it('returns empty string', () => {
      const { replica } = testElement('audio')
      expect(replica.canPlayType('notValidMIMEtype')).toBe('')
    })
  })

  describe('enden', () => {
    it('returns false', () => {
      const { replica } = testElement('audio')
      expect(replica.ended).toBeFalsy()
    })
  })

  describe('crossOrigin', () => {
    for (const crossOrigin of ['', null, 'use-credentials', 'anonymous']) {
      it(`set `, () => {
        const { primary, replica } = testElement('audio')
        primary.crossOrigin = <string>crossOrigin
        expect(replica.getAttribute('crossorigin')).toBe(crossOrigin)
        expect(replica.crossOrigin).toBe(crossOrigin)
      })
    }

    it(`return 'anonymous' if crossOrigin is not valid`, () => {
      const { primary, replica } = testElement('audio')
      primary.crossOrigin = 'randomString'
      expect(replica.getAttribute('crossorigin')).toBe('anonymous')
      expect(replica.crossOrigin).toBe('anonymous')
    })
  })

  describe('duration', () => {
    it('return NaN by default', () => {
      const { replica } = testElement('audio')
      expect(replica.duration).toBe(Number.NaN)
    })
  })

  describe('currentTime', () => {
    it('return default value', () => {
      const { replica } = testElement('audio')
      expect(replica.currentTime).toBe(0)
    })
    it('set value', () => {
      const { primary, replica } = testElement('audio')
      primary.currentTime = 42
      expect(replica.currentTime).toBe(42)
    })
    it('set value as a string', () => {
      const { primary, replica } = testElement('audio')
      primary.currentTime = '42'
      expect(replica.currentTime).toBe(42)
    })

    it('throw type error if currentTime is not a number', () => {
      const { primary } = testElement('audio')
      expect(() => {
        primary.currentTime = 'zeropointfive'
      }).toThrowError(
        new TypeError(
					`Failed to set the 'currentTime' property on 'HTMLMediaElement': The provided double value is non-finite.`,
        ),
      )
    })
  })

  describe('playbackRate', () => {
    it('return default value', () => {
      const { replica } = testElement('audio')
      expect(replica.playbackRate).toBe(1)
    })
    it('set value', () => {
      const { primary, replica } = testElement('audio')
      primary.playbackRate = 2.3
      expect(replica.playbackRate).toBe(2.3)
    })
    it('set value as a string', () => {
      const { primary, replica } = testElement('audio')
      primary.playbackRate = '2.3'
      expect(replica.playbackRate).toBe(2.3)
    })

    it('throw type error if playbackRate is not a number', () => {
      const { primary } = testElement('audio')
      expect(() => {
        primary.playbackRate = 'zeropointfive'
      }).toThrowError(
        new TypeError(
					`Failed to set the 'playbackRate' property on 'HTMLMediaElement': The provided double value is non-finite.`,
        ),
      )
    })
  })

  describe('defaultPlaybackRate', () => {
    it('return default value', () => {
      const { replica } = testElement('audio')
      expect(replica.defaultPlaybackRate).toBe(1)
    })
    it('set value', () => {
      const { primary, replica } = testElement('audio')
      primary.defaultPlaybackRate = 2.3
      expect(replica.defaultPlaybackRate).toBe(2.3)
    })
    it('set value as a string', () => {
      const { primary, replica } = testElement('audio')
      primary.defaultPlaybackRate = '0.3'
      expect(replica.defaultPlaybackRate).toBe(0.3)
    })

    it('throw type error if defaultPlaybackRate is not a number', () => {
      const { primary } = testElement('audio')
      expect(() => {
        primary.defaultPlaybackRate = 'zeropointfive'
      }).toThrowError(
        new TypeError(
					`Failed to set the 'defaultPlaybackRate' property on 'HTMLMediaElement': The provided double value is non-finite.`,
        ),
      )
    })
  })

  describe('error', () => {
    it('return null by default', () => {
      const { replica } = testElement('audio')
      expect(replica.error).toBeNull()
    })
  })

  describe('networkState', () => {
    it('return 0 by default', () => {
      const { replica } = testElement('audio')
      expect(replica.networkState).toBe(0)
    })
  })

  describe('preservesPitch', () => {
    it('return true by default', () => {
      const { replica } = testElement('audio')
      expect(replica.preservesPitch).toBe(true)
    })

    for (const property of [null, undefined, false]) {
      it(`set false with `, () => {
        const { primary, replica } = testElement('audio')
        primary.preservesPitch = <boolean>property
        expect(replica.preservesPitch).toBe(false)
      })
    }
  })

  describe('readyState', () => {
    it('return 0 by default', () => {
      const { replica } = testElement('audio')
      expect(replica.readyState).toBe(0)
    })
  })
})
