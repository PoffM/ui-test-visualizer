/*
  This file is derived from:
  https://github.com/capricorn86/happy-dom/blob/6cbcc10a1a227b36e38a7bc33203b2ae029cca95/packages/happy-dom/test/nodes/html-script-element/HTMLScriptElement.test.ts ,
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
import type { ErrorEvent, Event, IBrowserWindow, IDocument, IResponse, IWindow } from 'happy-dom'
import type IHTMLScriptElement from 'happy-dom/lib/nodes/html-script-element/IHTMLScriptElement'
import Fetch from '../../../node_modules/happy-dom/lib/fetch/Fetch'
import ResourceFetch from '../../../node_modules/happy-dom/lib/fetch/ResourceFetch'
import { addTestElement, initTestReplicaDom } from '../../test-setup'

describe('hTMLScriptElement', () => {
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
    if (replicaDocument.body.outerHTML.replace(/\ type="no-execute"/gm, '') !== document.body.outerHTML.replace(/\ type="no-execute"/gm, '')) {
      console.log('diff')
    }

    expect(replicaDocument.body.outerHTML.replace(/\ type="no-execute"/gm, ''))
      .toBe(document.body.outerHTML)
  })

  function testElement(type: string) {
    return addTestElement<IHTMLScriptElement>(
      document,
      replicaDocument,
      type,
      'createElement',
    )
  }

  describe('object.prototype.toString', () => {
    it('returns `[object HTMLScriptElement]`', () => {
      const { replica } = testElement('script')
      expect(Object.prototype.toString.call(replica)).toBe('[object HTMLScriptElement]')
    })
  })

  for (const property of ['type', 'charset', 'lang']) {
    describe(`get ${property}()`, () => {
      it(`returns the "`, () => {
        const { primary, replica } = testElement('script')
        primary.setAttribute(property, 'test')
        // @ts-expect-error property should exist
        expect(replica[property]).toBe('test')
      })
    })

    describe(`set ${property}()`, () => {
      it(`sets the attribute "`, () => {
        const { primary, replica } = testElement('script')
        // @ts-expect-error property should exist
        primary[property] = 'test'
        expect(replica.getAttribute(property)).toBe('test')
      })
    })
  }

  for (const property of ['async', 'defer']) {
    describe(`get ${property}()`, () => {
      it(`returns "true" if the "`, () => {
        const { primary, replica } = testElement('script')
        primary.setAttribute(property, '')
        // @ts-expect-error property should exist
        expect(replica[property]).toBe(true)
      })
    })

    describe(`set ${property}()`, () => {
      it(`sets the "`, () => {
        const { primary, replica } = testElement('script')
        // @ts-expect-error property should exist
        primary[property] = true
        expect(replica.getAttribute(property)).toBe('')
      })
    })
  }

  describe('get src()', () => {
    it('returns the "src" attribute.', () => {
      const { primary, replica } = testElement('script')
      primary.setAttribute('src', 'test')
      expect(replica.src).toBe('test')
    })
  })

  describe('set src()', () => {
    it('sets the attribute "src".', () => {
      const { primary, replica } = testElement('script')
      primary.src = 'test'
      expect(replica.getAttribute('src')).toBe('test')
    })

    it('loads and evaluates an external script when the attribute "src" is set and the element is connected to DOM.', async () => {
      const element = <IHTMLScriptElement>document.createElement('script')

      vi.spyOn(Fetch.prototype, 'send').mockImplementation(
        async () =>
					<IResponse>{
					  text: async () => 'globalThis.test = "test";',
					  ok: true,
					  status: 200,
					},
      )

      document.body.appendChild(element)

      element.async = true
      element.src = 'https://localhost:8080/path/to/script.js'

      await replicaWindow.happyDOM?.waitUntilComplete()

      // @ts-expect-error property should exist
      expect(replicaWindow.test).toBe('test')
    })

    it('does not evaluate script if the element is not connected to DOM.', async () => {
      const element = <IHTMLScriptElement>document.createElement('script')

      vi.spyOn(Fetch.prototype, 'send').mockImplementation(
        async () =>
					<IResponse>{
					  text: async () => 'globalThis.test = "test";',
					  ok: true,
					  status: 200,
					},
      )

      element.async = true
      element.src = 'https://localhost:8080/path/to/script.js'

      await replicaWindow.happyDOM?.waitUntilComplete()

      // @ts-expect-error property should exist
      expect(replicaWindow.test).toBe(undefined)
    })
  })

  describe('get text()', () => {
    it('returns the data of text nodes.', () => {
      const { primary, replica } = testElement('script')
      const text = document.createTextNode('test')
      primary.appendChild(text)
      expect(replica.text).toBe('test')
    })

    it('replaces all child nodes with a text node.', () => {
      const { primary, replica } = testElement('script')
      const text = document.createTextNode('test')
      primary.appendChild(text)
      primary.text = 'test2'
      expect(replica.text).toBe('test2')
    })
  })

  describe('set isConnected()', () => {
    it('evaluates the text content as code when appended to an element that is connected to the document.', () => {
      const element = <IHTMLScriptElement>document.createElement('script')
      element.text = 'globalThis.test = "test";globalThis.currentScript = document.currentScript;'
      document.body.appendChild(element)

      // @ts-expect-error property should exist
      expect(window.test).toBe('test')
      // @ts-expect-error property should exist
      expect(window.currentScript).toBe(element)
    })

    it('evaluates the text content as code when inserted before an element that is connected to the document.', () => {
      const element = <IHTMLScriptElement>document.createElement('script')
      const div1 = document.createElement('div')
      const div2 = document.createElement('div')

      element.text = 'globalThis.test = "test";globalThis.currentScript = document.currentScript;'
      element.id = 'my-script'

      div1.appendChild(element)

      document.body.appendChild(div2)
      document.body.insertBefore(div1, div2)
      document.body.appendChild(element)

      // @ts-expect-error property should exist
      expect(window.test).toBe('test')
      // @ts-expect-error property should exist
      expect(window.currentScript.id).toBe('my-script')
    })

    it('loads external script asynchronously.', async () => {
      let fetchedURL: string | null = null
      let loadEvent: Event | null = null

      vi.spyOn(Fetch.prototype, 'send').mockImplementation(async function () {
        // @ts-expect-error 'this' should exist
        fetchedURL = this.request.url
        return <IResponse>{
          text: async () =>
            'globalThis.test = "test";globalThis.currentScript = document.currentScript;',
          ok: true,
        }
      })

      const script = <IHTMLScriptElement>window.document.createElement('script')
      script.id = 'my-script'
      script.src = 'https://localhost:8080/path/to/script.js'
      script.async = true
      script.addEventListener('load', (event) => {
        loadEvent = event
      })

      document.body.appendChild(script)

      await replicaWindow.happyDOM?.waitUntilComplete()

      expect((<Event>(<unknown>loadEvent)).target).toBe(script)
      expect(fetchedURL).toBe('https://localhost:8080/path/to/script.js')
      // @ts-expect-error property should exist
      expect(replicaWindow.test).toBe('test')
      // @ts-expect-error property should exist
      expect(replicaWindow.currentScript.id).toBe('my-script')
    })

    it('triggers error event when loading external script asynchronously.', async () => {
      let errorEvent: ErrorEvent | null = null

      vi.spyOn(Fetch.prototype, 'send').mockImplementation(
        async () => <IResponse>(<unknown>{
          text: () => null,
          ok: false,
          status: 404,
          statusText: 'Not Found',
        }),
      )

      const script = <IHTMLScriptElement>window.document.createElement('script')
      script.src = 'https://localhost:8080/path/to/script.js'
      script.async = true
      script.addEventListener('error', (event) => {
        errorEvent = <ErrorEvent>event
      })

      document.body.appendChild(script)

      await window.happyDOM?.waitUntilComplete()

      expect((<ErrorEvent>(<unknown>errorEvent)).message).toBe(
        'Failed to perform request to "https://localhost:8080/path/to/script.js". Status 404 Not Found.',
      )
    })

    it('loads external script synchronously with relative URL.', async () => {
      window = new Window({
        url: 'https://localhost:8080/base/',
      })
      replicaWindow = new Window({
        url: 'https://localhost:8080/base/',
      })
      document = window.document
      replicaDocument = replicaWindow.document
      initTestReplicaDom(window, replicaWindow)

      let fetchedWindow: IBrowserWindow | null = null
      let fetchedURL: string | null = null
      let loadEvent: Event | null = null

      vi.spyOn(ResourceFetch.prototype, 'fetchSync').mockImplementation(function (url: string) {
        // @ts-expect-error 'this' should exist
        fetchedWindow = this.window
        fetchedURL = url
        return 'globalThis.test = "test";globalThis.currentScript = document.currentScript;'
      })

      const script = <IHTMLScriptElement>window.document.createElement('script')
      script.id = 'my-script'
      script.src = 'path/to/script.js'
      script.addEventListener('load', (event) => {
        loadEvent = event
      })

      document.body.appendChild(script)

      expect((<Event>(<unknown>loadEvent)).target).toBe(script)
      expect(fetchedWindow).toBe(window)
      expect(fetchedURL).toBe('https://localhost:8080/base/path/to/script.js')
      // @ts-expect-error property should exist
      expect(replicaWindow.test).toBe('test')
      // @ts-expect-error property should exist
      expect(replicaWindow.currentScript.id).toBe('my-script')
    })

    it('triggers error event when loading external script synchronously with relative URL.', () => {
      const window = new Window({ url: 'https://localhost:8080/base/' })
      const thrownError = new Error('error')
      let errorEvent: ErrorEvent | null = null

      vi.spyOn(ResourceFetch.prototype, 'fetchSync').mockImplementation(() => {
        throw thrownError
      })

      const script = <IHTMLScriptElement>window.document.createElement('script')
      script.src = 'path/to/script.js'
      script.addEventListener('error', (event) => {
        errorEvent = <ErrorEvent>event
      })

      document.body.appendChild(script)

      expect((<ErrorEvent>(<unknown>errorEvent)).message).toBe('error')
      expect((<ErrorEvent>(<unknown>errorEvent)).error).toBe(thrownError)
    })

    it('does not evaluate types that are not supported.', () => {
      const div = document.createElement('div')
      const element = <IHTMLScriptElement>window.document.createElement('script')
      element.type = 'application/json'
      element.textContent = '{"key": "value"}'
      div.appendChild(element)

      document.appendChild(div)

      expect(element.textContent).toBe('{"key": "value"}')
      expect(document.querySelector('script')!.textContent).toBe('{"key": "value"}')
      expect(replicaDocument.querySelector('script')!.textContent).toBe('{"key": "value"}')
    })

    it('does not evaluate code when added as innerHTML.', () => {
      const div = document.createElement('div')
      div.innerHTML = '<script>globalThis.test = "test";</script>'
      document.body.appendChild(div)
      // @ts-expect-error property should exist
      expect(replicaWindow.test).toBe(undefined)
    })

    it('does not evaluate code when added as outerHTML.', () => {
      const div = document.createElement('div')
      document.body.appendChild(div)
      div.outerHTML = '<script>globalThis.test = "test";</script>'
      // @ts-expect-error property should exist
      expect(replicaWindow.test).toBe(undefined)
    })

    it('does not evaluate code if the element is not connected to DOM.', () => {
      const div = document.createElement('div')
      const element = <IHTMLScriptElement>window.document.createElement('script')
      element.text = 'window.test = "test";'
      div.appendChild(element)
      // @ts-expect-error property should exist
      expect(replicaWindow.test).toBe(undefined)
    })

    it('evaluates the text content as code when using document.write().', () => {
      document.write('<script>globalThis.test = "test";</script>')
      // @ts-expect-error property should exist
      expect(replicaWindow.test).toBe('test')
    })

    it('evaluates the text content as code when using DOMParser.parseFromString().', () => {
      const domParser = new window.DOMParser()
      domParser.parseFromString('<script>globalThis.test = "test";</script>', 'text/html')

      // @ts-expect-error property should exist
      expect(window.test).toBe('test')
    })

    it('loads and evaluates an external script when "src" attribute has been set, but does not evaluate text content.', () => {
      const element = <IHTMLScriptElement>window.document.createElement('script')

      vi.spyOn(ResourceFetch.prototype, 'fetchSync').mockImplementation(
        () => 'globalThis.testFetch = "test";',
      )

      element.src = 'https://localhost:8080/path/to/script.js'
      element.text = 'globalThis.testContent = "test";'

      document.body.appendChild(element)

      // @ts-expect-error property should exist
      expect(replicaWindow.testFetch).toBe('test')
      // @ts-expect-error property should exist
      expect(replicaWindow.testContent).toBe(undefined)
    })

    it('does not load external scripts when "src" attribute has been set if the element is not connected to DOM.', () => {
      const element = <IHTMLScriptElement>window.document.createElement('script')

      vi.spyOn(ResourceFetch.prototype, 'fetchSync').mockImplementation(
        () => 'globalThis.testFetch = "test";',
      )

      element.src = 'https://localhost:8080/path/to/script.js'
      element.text = 'globalThis.test = "test";'

      // @ts-expect-error property should exist
      expect(replicaWindow.testFetch).toBe(undefined)
      // @ts-expect-error property should exist
      expect(replicaWindow.testContent).toBe(undefined)
    })

    it('triggers an error event when attempting to perform an asynchrounous request and the Happy DOM setting "disableJavaScriptFileLoading" is set to "true".', () => {
      window = new Window({
        settings: { disableJavaScriptFileLoading: true },
      })
      replicaWindow = new Window({
        settings: { disableJavaScriptFileLoading: true },
      })
      document = window.document
      replicaDocument = replicaWindow.document
      initTestReplicaDom(window, replicaWindow)

      let errorEvent: ErrorEvent | null = null

      const script = <IHTMLScriptElement>window.document.createElement('script')
      script.src = 'https://localhost:8080/path/to/script.js'
      script.async = true
      script.addEventListener('error', (event) => {
        errorEvent = <ErrorEvent>event
      })

      document.body.appendChild(script)

      expect((<ErrorEvent>(<unknown>errorEvent)).message).toBe(
        'Failed to load external script "https://localhost:8080/path/to/script.js". JavaScript file loading is disabled.',
      )
    })

    it('triggers an error event when attempting to perform a synchrounous request and the Happy DOM setting "disableJavaScriptFileLoading" is set to "true".', () => {
      window = new Window({
        settings: { disableJavaScriptFileLoading: true },
      })
      replicaWindow = new Window({
        settings: { disableJavaScriptFileLoading: true },
      })
      document = window.document
      replicaDocument = replicaWindow.document
      initTestReplicaDom(window, replicaWindow)

      let errorEvent: ErrorEvent | null = null

      const script = <IHTMLScriptElement>window.document.createElement('script')
      script.src = 'https://localhost:8080/path/to/script.js'
      script.addEventListener('error', (event) => {
        errorEvent = <ErrorEvent>event
      })

      document.body.appendChild(script)

      expect((<ErrorEvent>(<unknown>errorEvent)).message).toBe(
        'Failed to load external script "https://localhost:8080/path/to/script.js". JavaScript file loading is disabled.',
      )
    })

    it('triggers an error event when attempting to perform an asynchrounous request and the Happy DOM setting "disableJavaScriptFileLoading" is set to "true". 2', () => {
      window = new Window({
        settings: { disableJavaScriptFileLoading: true },
      })
      replicaWindow = new Window({
        settings: { disableJavaScriptFileLoading: true },
      })
      document = window.document
      replicaDocument = replicaWindow.document
      initTestReplicaDom(window, replicaWindow)

      let errorEvent: ErrorEvent | null = null

      const script = <IHTMLScriptElement>window.document.createElement('script')
      script.src = 'https://localhost:8080/path/to/script.js'
      script.async = true
      script.addEventListener('error', (event) => {
        errorEvent = <ErrorEvent>event
      })

      document.body.appendChild(script)

      expect((<ErrorEvent>(<unknown>errorEvent)).message).toBe(
        'Failed to load external script "https://localhost:8080/path/to/script.js". JavaScript file loading is disabled.',
      )
    })

    it('triggers an error event when attempting to perform a synchrounous request and the Happy DOM setting "disableJavaScriptFileLoading" is set to "true". 2', () => {
      window = new Window({
        settings: { disableJavaScriptFileLoading: true },
      })
      replicaWindow = new Window({
        settings: { disableJavaScriptFileLoading: true },
      })
      document = window.document
      replicaDocument = replicaWindow.document
      initTestReplicaDom(window, replicaWindow)

      let errorEvent: ErrorEvent | null = null

      const script = <IHTMLScriptElement>window.document.createElement('script')
      script.src = 'https://localhost:8080/path/to/script.js'
      script.addEventListener('error', (event) => {
        errorEvent = <ErrorEvent>event
      })

      document.body.appendChild(script)

      expect((<ErrorEvent>(<unknown>errorEvent)).message).toBe(
        'Failed to load external script "https://localhost:8080/path/to/script.js". JavaScript file loading is disabled.',
      )
    })

    it('triggers an error event on Window when attempting to perform an asynchrounous request containing invalid JavaScript.', async () => {
      let errorEvent: ErrorEvent | null = null

      vi.spyOn(Fetch.prototype, 'send').mockImplementation(
        async () =>
					<IResponse>{
					  text: async () => 'globalThis.test = /;',
					  ok: true,
					},
      )

      window.addEventListener('error', event => (errorEvent = <ErrorEvent>event))

      const script = <IHTMLScriptElement>window.document.createElement('script')
      script.src = 'https://localhost:8080/base/path/to/script/'
      script.async = true

      document.body.appendChild(script)

      await window.happyDOM?.waitUntilComplete()

      expect((<ErrorEvent>(<unknown>errorEvent)).error?.message).toBe(
        'Invalid regular expression: missing /',
      )

      const consoleOutput = window.happyDOM?.virtualConsolePrinter.readAsString() || ''
      expect(consoleOutput.startsWith('SyntaxError: Invalid regular expression: missing /')).toBe(
        true,
      )
    })

    it('triggers an error event on Window when attempting to perform a synchrounous request containing invalid JavaScript.', () => {
      let errorEvent: ErrorEvent | null = null

      vi.spyOn(ResourceFetch.prototype, 'fetchSync').mockImplementation(
        () => 'globalThis.test = /;',
      )

      replicaWindow.addEventListener('error', event => (errorEvent = <ErrorEvent>event))

      const script = <IHTMLScriptElement>window.document.createElement('script')
      script.src = 'https://localhost:8080/base/path/to/script/'

      document.body.appendChild(script)

      expect((<ErrorEvent>(<unknown>errorEvent)).error?.message).toBe(
        'Invalid regular expression: missing /',
      )

      const consoleOutput = replicaWindow.happyDOM?.virtualConsolePrinter.readAsString() || ''
      expect(consoleOutput.startsWith('SyntaxError: Invalid regular expression: missing /')).toBe(
        true,
      )
    })

    it('triggers an error event on Window when appending an element that contains invalid Javascript.', () => {
      const element = <IHTMLScriptElement>document.createElement('script')
      let errorEvent: ErrorEvent | null = null

      window.addEventListener('error', event => (errorEvent = <ErrorEvent>event))

      element.text = 'globalThis.test = /;'

      document.body.appendChild(element)

      expect((<ErrorEvent>(<unknown>errorEvent)).error?.message).toBe(
        'Invalid regular expression: missing /',
      )

      // Error in the primary window because it runs the script
      const consoleOutput = window.happyDOM?.virtualConsolePrinter.readAsString() || ''
      expect(consoleOutput.startsWith('SyntaxError: Invalid regular expression: missing /')).toBe(
        true,
      )

      // No error in the replica window because it doesn't run the script
      const replicaConsoleOutput = replicaWindow.happyDOM?.virtualConsolePrinter.readAsString() || ''
      expect(replicaConsoleOutput).toBe('')
    })

    it('throws an exception when appending an element that contains invalid Javascript and the Happy DOM setting "disableErrorCapturing" is set to true.', () => {
      window = new Window({
        settings: { disableErrorCapturing: true },
      })
      replicaWindow = new Window({
        settings: { disableErrorCapturing: true },
      })
      document = window.document
      replicaDocument = replicaWindow.document
      initTestReplicaDom(window, replicaWindow)

      const element = <IHTMLScriptElement>document.createElement('script')

      element.text = 'globalThis.test = /;'

      expect(() => {
        document.body.appendChild(element)
      }).toThrow(new TypeError('Invalid regular expression: missing /'))
    })

    it('throws an exception when appending an element that contains invalid Javascript and the Happy DOM setting "errorCapture" is set to "disabled".', () => {
      window = new Window({
        // @ts-expect-error should be valid enum value
        settings: { errorCapture: 'disabled' },
      })
      replicaWindow = new Window({
        // @ts-expect-error should be valid enum value
        settings: { errorCapture: 'disabled' },
      })
      document = window.document
      replicaDocument = replicaWindow.document
      initTestReplicaDom(window, replicaWindow)

      const element = <IHTMLScriptElement>document.createElement('script')

      element.text = 'globalThis.test = /;'

      expect(() => {
        document.body.appendChild(element)
      }).toThrow(new TypeError('Invalid regular expression: missing /'))
    })
  })
})
