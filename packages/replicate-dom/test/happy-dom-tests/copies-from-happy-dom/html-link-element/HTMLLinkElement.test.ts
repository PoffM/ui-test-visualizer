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

import Window from '../../../src/window/Window.js';
import IWindow from '../../../src/window/IWindow.js';
import IBrowserWindow from '../../../src/window/IBrowserWindow.js';
import IDocument from '../../../src/nodes/document/IDocument.js';
import IHTMLLinkElement from '../../../src/nodes/html-link-element/IHTMLLinkElement.js';
import ResourceFetch from '../../../src/fetch/ResourceFetch.js';
import Event from '../../../src/event/Event.js';
import ErrorEvent from '../../../src/event/events/ErrorEvent.js';
import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';

describe('HTMLLinkElement', () => {
	let window: IWindow;
	let document: IDocument;

	beforeEach(() => {
		window = new Window();
		document = window.document;
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe('Object.prototype.toString', () => {
		it('Returns `[object HTMLLinkElement]`', () => {
			const element = <IHTMLLinkElement>document.createElement('link');
			expect(Object.prototype.toString.call(element)).toBe('[object HTMLLinkElement]');
		});
	});

	for (const property of [
		'as',
		'crossOrigin',
		'href',
		'hreflang',
		'media',
		'referrerPolicy',
		'rel',
		'type'
	]) {
		describe(`get ${property}()`, () => {
			it(`Returns the "${property}" attribute.`, () => {
				const element = <IHTMLLinkElement>document.createElement('link');
				element.setAttribute(property, 'test');
				expect(element[property]).toBe('test');
			});
		});

		describe(`set ${property}()`, () => {
			it(`Sets the attribute "${property}".`, () => {
				const element = <IHTMLLinkElement>document.createElement('link');
				element[property] = 'test';
				expect(element.getAttribute(property)).toBe('test');
			});
		});
	}

	describe('get relList()', () => {
		it('Returns a DOMTokenList object.', () => {
			const element = <IHTMLLinkElement>document.createElement('link');
			element.setAttribute('rel', 'value1 value2');
			expect(element.relList.value).toBe('value1 value2');
		});
	});

	describe('get href()', () => {
		it('Returns the "href" attribute.', () => {
			const element = <IHTMLLinkElement>document.createElement('link');
			element.setAttribute('href', 'test');
			expect(element.href).toBe('test');
		});
	});

	describe('set href()', () => {
		it('Sets the attribute "href".', () => {
			const element = <IHTMLLinkElement>document.createElement('link');
			element.href = 'test';
			expect(element.getAttribute('href')).toBe('test');
		});

		it('Loads and evaluates an external CSS file when the attribute "href" and "rel" is set and the element is connected to DOM.', async () => {
			const element = <IHTMLLinkElement>document.createElement('link');
			const css = 'div { background: red; }';
			let loadedWindow: IBrowserWindow | null = null;
			let loadedURL: string | null = null;
			let loadEvent: Event | null = null;

			vi.spyOn(ResourceFetch.prototype, 'fetch').mockImplementation(async function (url: string) {
				loadedWindow = this.window;
				loadedURL = url;
				return css;
			});

			document.body.appendChild(element);

			element.addEventListener('load', (event) => {
				loadEvent = event;
			});

			element.rel = 'stylesheet';
			element.href = 'https://localhost:8080/test/path/file.css';

			await window.happyDOM?.waitUntilComplete();

			expect(loadedWindow).toBe(window);
			expect(loadedURL).toBe('https://localhost:8080/test/path/file.css');
			expect(element.sheet.cssRules.length).toBe(1);
			expect(element.sheet.cssRules[0].cssText).toBe('div { background: red; }');
			expect((<Event>(<unknown>loadEvent)).target).toBe(element);
		});

		it('Triggers error event when fetching a CSS file fails during setting the "href" and "rel" attributes.', async () => {
			const element = <IHTMLLinkElement>document.createElement('link');
			const thrownError = new Error('error');
			let errorEvent: ErrorEvent | null = null;

			vi.spyOn(ResourceFetch.prototype, 'fetch').mockImplementation(async function () {
				throw thrownError;
			});

			document.body.appendChild(element);

			element.addEventListener('error', (event) => {
				errorEvent = <ErrorEvent>event;
			});

			element.rel = 'stylesheet';
			element.href = 'https://localhost:8080/test/path/file.css';

			await window.happyDOM?.waitUntilComplete();

			expect((<ErrorEvent>(<unknown>errorEvent)).error).toEqual(thrownError);
			expect((<ErrorEvent>(<unknown>errorEvent)).message).toEqual('error');
		});

		it('Does not load and evaluate external CSS files if the element is not connected to DOM.', () => {
			const element = <IHTMLLinkElement>document.createElement('link');
			const css = 'div { background: red; }';
			let loadedWindow: IBrowserWindow | null = null;
			let loadedURL: string | null = null;

			vi.spyOn(ResourceFetch.prototype, 'fetch').mockImplementation(async function (url: string) {
				loadedWindow = this.window;
				loadedURL = url;
				return css;
			});

			element.rel = 'stylesheet';
			element.href = 'https://localhost:8080/test/path/file.css';

			expect(loadedWindow).toBe(null);
			expect(loadedURL).toBe(null);
		});
	});

	describe('set isConnected()', () => {
		it('Loads and evaluates an external CSS file when "href" attribute has been set, but does not evaluate text content.', async () => {
			const element = <IHTMLLinkElement>document.createElement('link');
			const css = 'div { background: red; }';
			let loadEvent: Event | null = null;
			let loadedWindow: IBrowserWindow | null = null;
			let loadedURL: string | null = null;

			vi.spyOn(ResourceFetch.prototype, 'fetch').mockImplementation(async function (url: string) {
				loadedWindow = this.window;
				loadedURL = url;
				return css;
			});

			element.rel = 'stylesheet';
			element.href = 'https://localhost:8080/test/path/file.css';
			element.addEventListener('load', (event) => {
				loadEvent = event;
			});

			document.body.appendChild(element);

			await window.happyDOM?.waitUntilComplete();

			expect(loadedWindow).toBe(window);
			expect(loadedURL).toBe('https://localhost:8080/test/path/file.css');
			expect(element.sheet.cssRules.length).toBe(1);
			expect(element.sheet.cssRules[0].cssText).toBe('div { background: red; }');
			expect((<Event>(<unknown>loadEvent)).target).toBe(element);
		});

		it('Triggers error event when fetching a CSS file fails while appending the element to the document.', async () => {
			const element = <IHTMLLinkElement>document.createElement('link');
			const thrownError = new Error('error');
			let errorEvent: ErrorEvent | null = null;

			vi.spyOn(ResourceFetch.prototype, 'fetch').mockImplementation(async function () {
				throw thrownError;
			});

			element.rel = 'stylesheet';
			element.href = 'https://localhost:8080/test/path/file.css';
			element.addEventListener('error', (event) => {
				errorEvent = <ErrorEvent>event;
			});

			document.body.appendChild(element);

			await window.happyDOM?.waitUntilComplete();

			expect((<ErrorEvent>(<unknown>errorEvent)).error).toEqual(thrownError);
			expect((<ErrorEvent>(<unknown>errorEvent)).message).toEqual('error');
		});

		it('Does not load external CSS file when "href" attribute has been set if the element is not connected to DOM.', () => {
			const element = <IHTMLLinkElement>document.createElement('link');
			const css = 'div { background: red; }';
			let loadedWindow: IBrowserWindow | null = null;
			let loadedURL: string | null = null;

			vi.spyOn(ResourceFetch.prototype, 'fetch').mockImplementation(async function (url: string) {
				loadedWindow = this.window;
				loadedURL = url;
				return css;
			});

			element.rel = 'stylesheet';
			element.href = 'https://localhost:8080/test/path/file.css';

			expect(loadedWindow).toBe(null);
			expect(loadedURL).toBe(null);
			expect(element.sheet).toBe(null);
		});

		it('Triggers an error event when the Happy DOM setting "disableCSSFileLoading" is set to "true".', async () => {
			window = new Window({
				settings: { disableCSSFileLoading: true }
			});
			document = window.document;

			const element = <IHTMLLinkElement>document.createElement('link');
			let errorEvent: ErrorEvent | null = null;

			element.rel = 'stylesheet';
			element.href = 'https://localhost:8080/test/path/file.css';
			element.addEventListener('error', (event) => (errorEvent = <ErrorEvent>event));

			document.body.appendChild(element);

			expect(element.sheet).toBe(null);
			expect((<ErrorEvent>(<unknown>errorEvent)).message).toBe(
				'Failed to load external stylesheet "https://localhost:8080/test/path/file.css". CSS file loading is disabled.'
			);
		});
	});
});
