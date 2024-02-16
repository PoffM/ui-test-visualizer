/*
  This file is derived from:
  https://github.com/capricorn86/happy-dom/blob/6cbcc10a1a227b36e38a7bc33203b2ae029cca95/packages/happy-dom/test/nodes/html-link-element/HTMLLinkElement.test.ts ,
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
import type { ErrorEvent, Event, IBrowserWindow, IDocument, IHTMLLinkElement, IWindow } from 'happy-dom'
import ResourceFetch from '../../../node_modules/happy-dom/lib/fetch/ResourceFetch'
import { addTestElement, initTestReplicaDom } from '../../test-setup'

describe('hTMLLinkElement', () => {
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
    return addTestElement<IHTMLLinkElement>(
      document,
      replicaDocument,
      type,
      'createElement',
    )
  }

  describe('object.prototype.toString', () => {
    it('returns `[object HTMLLinkElement]`', () => {
      const element = <IHTMLLinkElement>document.createElement('link')
      expect(Object.prototype.toString.call(element)).toBe('[object HTMLLinkElement]')
    })
  })

  for (const property of [
    'as',
    'crossOrigin',
    'href',
    'hreflang',
    'media',
    'referrerPolicy',
    'rel',
    'type',
  ]) {
    describe(`get ${property}()`, () => {
      it(`returns the "`, () => {
        const { primary, replica } = testElement('link')
        primary.setAttribute(property, 'test')
        // @ts-expect-error property should exist
        expect(replica[property]).toBe('test')
      })
    })

    describe(`set ${property}()`, () => {
      it(`sets the attribute "`, () => {
        const { primary, replica } = testElement('link')
        // @ts-expect-error property should exist
        primary[property] = 'test'
        expect(replica.getAttribute(property)).toBe('test')
      })
    })
  }

  describe('get relList()', () => {
    it('returns a DOMTokenList object.', () => {
      const { primary, replica } = testElement('link')
      primary.setAttribute('rel', 'value1 value2')
      expect(replica.relList.value).toBe('value1 value2')
    })
  })

  describe('get href()', () => {
    it('returns the "href" attribute.', () => {
      const { primary, replica } = testElement('link')
      primary.setAttribute('href', 'test')
      expect(replica.href).toBe('test')
    })
  })

  describe('set href()', () => {
    it('sets the attribute "href".', () => {
      const { primary, replica } = testElement('link')
      primary.href = 'test'
      expect(replica.getAttribute('href')).toBe('test')
    })

    it('loads and evaluates an external CSS file when the attribute "href" and "rel" is set and the element is connected to DOM.', async () => {
      const element = <IHTMLLinkElement>document.createElement('link')
      const css = 'div { background: red; }'
      let loadedWindow: IBrowserWindow | null = null
      let loadedURL: string | null = null
      let loadEvent: Event | null = null

      vi.spyOn(ResourceFetch.prototype, 'fetch').mockImplementation(async function (url: string) {
        // @ts-expect-error 'this' should work
        loadedWindow = this.window
        loadedURL = url
        return css
      })

      document.body.appendChild(element)

      element.addEventListener('load', (event) => {
        loadEvent = event
      })

      element.rel = 'stylesheet'
      element.href = 'https://localhost:8080/test/path/file.css'

      await window.happyDOM?.waitUntilComplete()

      expect(loadedWindow).toBe(window)
      expect(loadedURL).toBe('https://localhost:8080/test/path/file.css')

      const replicaLink = <IHTMLLinkElement>replicaDocument.querySelector('link')
      expect(replicaLink.sheet.cssRules.length).toBe(1)
      expect(replicaLink.sheet.cssRules[0]!.cssText).toBe('div { background: red; }')
      expect((<Event>(<unknown>loadEvent)).target).toBe(element)
    })

    it('triggers error event when fetching a CSS file fails during setting the "href" and "rel" attributes.', async () => {
      const element = <IHTMLLinkElement>document.createElement('link')
      const thrownError = new Error('error')
      let errorEvent: ErrorEvent | null = null

      vi.spyOn(ResourceFetch.prototype, 'fetch').mockImplementation(async function () {
        throw thrownError
      })

      document.body.appendChild(element)

      element.addEventListener('error', (event) => {
        errorEvent = <ErrorEvent>event
      })

      element.rel = 'stylesheet'
      element.href = 'https://localhost:8080/test/path/file.css'

      await window.happyDOM?.waitUntilComplete()

      expect((<ErrorEvent>(<unknown>errorEvent)).error).toEqual(thrownError)
      expect((<ErrorEvent>(<unknown>errorEvent)).message).toEqual('error')
    })

    it('does not load and evaluate external CSS files if the element is not connected to DOM.', () => {
      const element = <IHTMLLinkElement>document.createElement('link')
      const css = 'div { background: red; }'
      let loadedWindow: IBrowserWindow | null = null
      let loadedURL: string | null = null

      vi.spyOn(ResourceFetch.prototype, 'fetch').mockImplementation(async function (url: string) {
        // @ts-expect-error 'this' should work
        loadedWindow = this.window
        loadedURL = url
        return css
      })

      element.rel = 'stylesheet'
      element.href = 'https://localhost:8080/test/path/file.css'

      expect(loadedWindow).toBe(null)
      expect(loadedURL).toBe(null)
    })
  })

  describe('set isConnected()', () => {
    it('loads and evaluates an external CSS file when "href" attribute has been set, but does not evaluate text content.', async () => {
      const element = <IHTMLLinkElement>document.createElement('link')
      const css = 'div { background: red; }'
      let loadEvent: Event | null = null
      let loadedWindow: IBrowserWindow | null = null
      let loadedURL: string | null = null

      vi.spyOn(ResourceFetch.prototype, 'fetch').mockImplementation(async function (url: string) {
        // @ts-expect-error 'this' should work
        loadedWindow = this.window
        loadedURL = url
        return css
      })

      element.rel = 'stylesheet'
      element.href = 'https://localhost:8080/test/path/file.css'
      element.addEventListener('load', (event) => {
        loadEvent = event
      })

      document.body.appendChild(element)

      await window.happyDOM?.waitUntilComplete()

      expect(loadedWindow).toBe(window)
      expect(loadedURL).toBe('https://localhost:8080/test/path/file.css')

      const replicaLink = <IHTMLLinkElement>replicaDocument.querySelector('link')
      expect(replicaLink.sheet.cssRules.length).toBe(1)
      expect(replicaLink.sheet.cssRules[0]!.cssText).toBe('div { background: red; }')
      expect((<Event>(<unknown>loadEvent)).target).toBe(element)
    })

    it('triggers error event when fetching a CSS file fails while appending the element to the document.', async () => {
      const element = <IHTMLLinkElement>document.createElement('link')
      const thrownError = new Error('error')
      let errorEvent: ErrorEvent | null = null

      vi.spyOn(ResourceFetch.prototype, 'fetch').mockImplementation(async function () {
        throw thrownError
      })

      element.rel = 'stylesheet'
      element.href = 'https://localhost:8080/test/path/file.css'
      element.addEventListener('error', (event) => {
        errorEvent = <ErrorEvent>event
      })

      document.body.appendChild(element)

      await window.happyDOM?.waitUntilComplete()

      expect((<ErrorEvent>(<unknown>errorEvent)).error).toEqual(thrownError)
      expect((<ErrorEvent>(<unknown>errorEvent)).message).toEqual('error')
    })

    it('does not load external CSS file when "href" attribute has been set if the element is not connected to DOM.', () => {
      const element = <IHTMLLinkElement>document.createElement('link')
      const css = 'div { background: red; }'
      let loadedWindow: IBrowserWindow | null = null
      let loadedURL: string | null = null

      vi.spyOn(ResourceFetch.prototype, 'fetch').mockImplementation(async function (url: string) {
        // @ts-expect-error 'this' should work
        loadedWindow = this.window
        loadedURL = url
        return css
      })

      element.rel = 'stylesheet'
      element.href = 'https://localhost:8080/test/path/file.css'

      expect(loadedWindow).toBe(null)
      expect(loadedURL).toBe(null)
      expect(element.sheet).toBe(null)
    })

    it('triggers an error event when the Happy DOM setting "disableCSSFileLoading" is set to "true".', async () => {
      window = new Window({
        settings: { disableCSSFileLoading: true },
      })
      replicaWindow = new Window({
        settings: { disableCSSFileLoading: true },
      })
      initTestReplicaDom(window, replicaWindow)
      document = window.document
      replicaDocument = window.document

      const element = <IHTMLLinkElement>document.createElement('link')
      let errorEvent: ErrorEvent | null = null

      element.rel = 'stylesheet'
      element.href = 'https://localhost:8080/test/path/file.css'
      element.addEventListener('error', event => (errorEvent = <ErrorEvent>event))

      document.body.appendChild(element)

      expect(element.sheet).toBe(null)
      expect((<ErrorEvent>(<unknown>errorEvent)).message).toBe(
        'Failed to load external stylesheet "https://localhost:8080/test/path/file.css". CSS file loading is disabled.',
      )
    })
  })
})
