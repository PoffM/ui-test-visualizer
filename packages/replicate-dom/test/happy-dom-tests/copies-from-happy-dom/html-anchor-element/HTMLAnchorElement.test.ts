/*
  This file is derived from:
  https://github.com/capricorn86/happy-dom/blob/6cbcc10a1a227b36e38a7bc33203b2ae029cca95/packages/happy-dom/test/nodes/html-anchor-element/HTMLAnchorElement.test.ts ,
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
import IDocument from '../../../src/nodes/document/IDocument.js';
import IHTMLAnchorElement from '../../../src/nodes/html-anchor-element/IHTMLAnchorElement.js';
import { beforeEach, describe, it, expect, vi } from 'vitest';
import PointerEvent from '../../../src/event/events/PointerEvent.js';
import IRequest from '../../../src/fetch/types/IRequest.js';
import IResponse from '../../../src/fetch/types/IResponse.js';
import Fetch from '../../../src/fetch/Fetch.js';
import Browser from '../../../src/browser/Browser.js';

const BLOB_URL = 'blob:https://mozilla.org';

describe('HTMLAnchorElement', () => {
	let window: IWindow;
	let document: IDocument;

	beforeEach(() => {
		window = new Window({ url: 'https://www.somesite.com/test.html' });
		document = window.document;
	});

	describe('Object.prototype.toString', () => {
		it('Returns `[object HTMLAnchorElement]`', () => {
			const element = document.createElement('a');
			expect(Object.prototype.toString.call(element)).toBe('[object HTMLAnchorElement]');
		});
	});

	for (const property of [
		'download',
		'hreflang',
		'ping',
		'target',
		'referrerPolicy',
		'rel',
		'type'
	]) {
		describe(`get ${property}()`, () => {
			it(`Returns the "${property}" attribute.`, () => {
				const element = document.createElement('a');
				element.setAttribute(property, 'test');
				expect(element[property]).toBe('test');
			});
		});

		describe(`set ${property}()`, () => {
			it(`Sets the attribute "${property}".`, () => {
				const element = document.createElement('a');
				element[property] = 'test';
				expect(element.getAttribute(property)).toBe('test');
			});
		});
	}

	describe('get href()', () => {
		it('Returns the "href" attribute.', () => {
			const element = <IHTMLAnchorElement>document.createElement('a');
			element.setAttribute('href', 'test');
			expect(element.href).toBe('https://www.somesite.com/test');
		});

		it('Returns the "href" attribute when scheme is http.', () => {
			const element = <IHTMLAnchorElement>document.createElement('a');
			element.setAttribute('href', 'http://www.example.com');
			expect(element.href).toBe('http://www.example.com/');
		});

		it('Returns the "href" attribute when scheme is tel.', () => {
			const element = <IHTMLAnchorElement>document.createElement('a');
			element.setAttribute('href', 'tel:+123456789');
			expect(element.href).toBe('tel:+123456789');
		});

		it('Returns the "href" attribute when scheme-relative', () => {
			const element = <IHTMLAnchorElement>document.createElement('a');
			element.setAttribute('href', '//example.com');
			expect(element.href).toBe('https://example.com/');
		});

		it('Returns empty string if "href" attribute is empty.', () => {
			const element = <IHTMLAnchorElement>document.createElement('a');
			expect(element.href).toBe('');
		});
	});

	describe('toString()', () => {
		it('Returns the "href" attribute.', () => {
			const element = <IHTMLAnchorElement>document.createElement('a');
			element.setAttribute('href', 'test');
			expect(element.toString()).toBe('https://www.somesite.com/test');
		});

		it('Returns the "href" attribute when scheme is http.', () => {
			const element = <IHTMLAnchorElement>document.createElement('a');
			element.setAttribute('href', 'http://www.example.com');
			expect(element.toString()).toBe('http://www.example.com/');
		});

		it('Returns the "href" attribute when scheme is tel.', () => {
			const element = <IHTMLAnchorElement>document.createElement('a');
			element.setAttribute('href', 'tel:+123456789');
			expect(element.toString()).toBe('tel:+123456789');
		});

		it('Returns the "href" attribute when scheme-relative', () => {
			const element = <IHTMLAnchorElement>document.createElement('a');
			element.setAttribute('href', '//example.com');
			expect(element.toString()).toBe('https://example.com/');
		});

		it('Returns empty string if "href" attribute is empty.', () => {
			const element = <IHTMLAnchorElement>document.createElement('a');
			expect(element.toString()).toBe('');
		});
	});

	describe('set href()', () => {
		it('Sets the attribute "href".', () => {
			const element = <IHTMLAnchorElement>document.createElement('a');
			element.href = 'test';
			expect(element.getAttribute('href')).toBe('test');
		});

		it('Can be set after a blob URL has been defined.', () => {
			const element = <IHTMLAnchorElement>document.createElement('a');
			element.href = BLOB_URL;
			expect(element.href).toBe(BLOB_URL);
			element.href = 'https://example.com/';
			expect(element.href).toBe('https://example.com/');
		});
	});

	describe('get origin()', () => {
		it("Returns the href URL's origin.", () => {
			const element = <IHTMLAnchorElement>document.createElement('a');
			element.setAttribute('href', 'https://www.example.com:443/path?q1=a#xyz');
			expect(element.origin).toBe('https://www.example.com');
		});

		it("Returns the href URL's origin with port when non-standard.", () => {
			const element = <IHTMLAnchorElement>document.createElement('a');
			element.setAttribute('href', 'http://www.example.com:8080/path?q1=a#xyz');
			expect(element.origin).toBe('http://www.example.com:8080');
		});

		it("Returns the page's origin when href is relative.", () => {
			const element = <IHTMLAnchorElement>document.createElement('a');
			element.setAttribute('href', '/path?q1=a#xyz');
			expect(element.origin).toBe('https://www.somesite.com');
		});
	});

	describe('get protocol()', () => {
		it("Returns the href URL's protocol.", () => {
			const element = <IHTMLAnchorElement>document.createElement('a');
			element.setAttribute('href', 'https://www.example.com:443/path?q1=a#xyz');
			expect(element.protocol).toBe('https:');
		});
	});

	describe('set protocol()', () => {
		it("Sets the href URL's protocol.", () => {
			const element = <IHTMLAnchorElement>document.createElement('a');
			element.setAttribute('href', 'https://www.example.com:443/path?q1=a#xyz');

			expect(element.protocol).toBe('https:');

			element.protocol = 'http';
			expect(element.protocol).toBe('http:');
			expect(element.href).toBe('http://www.example.com/path?q1=a#xyz');
		});

		it("Can't be modified on blob URLs.", () => {
			const element = <IHTMLAnchorElement>document.createElement('a');
			element.href = BLOB_URL;
			element.protocol = 'http';
			expect(element.protocol).toBe('blob:');
		});
	});

	describe('get username()', () => {
		it("Returns the href URL's username.", () => {
			const element = <IHTMLAnchorElement>document.createElement('a');
			element.setAttribute('href', 'https://user:pw@www.example.com:443/path?q1=a#xyz');
			expect(element.username).toBe('user');
		});
	});

	describe('set username()', () => {
		it("Sets the href URL's username.", () => {
			const element = <IHTMLAnchorElement>document.createElement('a');
			element.setAttribute('href', 'https://user:pw@www.example.com:443/path?q1=a#xyz');

			expect(element.username).toBe('user');

			element.username = 'user2';
			expect(element.username).toBe('user2');
			expect(element.href).toBe('https://user2:pw@www.example.com/path?q1=a#xyz');
		});

		it("Can't be modified on blob URLs.", () => {
			const element = <IHTMLAnchorElement>document.createElement('a');
			element.href = BLOB_URL;
			element.username = 'user2';
			expect(element.username).toBe('');
		});
	});

	describe('get password()', () => {
		it("Returns the href URL's password.", () => {
			const element = <IHTMLAnchorElement>document.createElement('a');
			element.setAttribute('href', 'https://user:pw@www.example.com:443/path?q1=a#xyz');
			expect(element.password).toBe('pw');
		});
	});

	describe('set password()', () => {
		it("Sets the href URL's password.", () => {
			const element = <IHTMLAnchorElement>document.createElement('a');
			element.setAttribute('href', 'https://user:pw@www.example.com:443/path?q1=a#xyz');

			expect(element.password).toBe('pw');

			element.password = 'pw2';
			expect(element.password).toBe('pw2');
			expect(element.href).toBe('https://user:pw2@www.example.com/path?q1=a#xyz');
		});

		it("Can't be modified on blob URLs.", () => {
			const element = <IHTMLAnchorElement>document.createElement('a');
			element.href = BLOB_URL;
			element.password = 'pw2';
			expect(element.password).toBe('');
		});
	});

	describe('get host()', () => {
		it("Returns the href URL's host.", () => {
			const element = <IHTMLAnchorElement>document.createElement('a');
			element.setAttribute('href', 'https://www.example.com:443/path?q1=a#xyz');
			expect(element.host).toBe('www.example.com');
		});
	});

	describe('set host()', () => {
		it("Sets the href URL's host.", () => {
			const element = <IHTMLAnchorElement>document.createElement('a');
			element.setAttribute('href', 'https://www.example.com:443/path?q1=a#xyz');

			expect(element.host).toBe('www.example.com');

			element.host = 'abc.example2.com';
			expect(element.host).toBe('abc.example2.com');
			expect(element.href).toBe('https://abc.example2.com/path?q1=a#xyz');
		});

		it("Can't be modified on blob URLs.", () => {
			const element = <IHTMLAnchorElement>document.createElement('a');
			element.href = BLOB_URL;
			element.host = 'abc.example2.com';
			expect(element.host).toBe('');
		});
	});

	describe('get hostname()', () => {
		it("Returns the href URL's hostname.", () => {
			const element = <IHTMLAnchorElement>document.createElement('a');
			element.setAttribute('href', 'https://www.example.com:443/path?q1=a#xyz');
			expect(element.hostname).toBe('www.example.com');
		});
	});

	describe('set hostname()', () => {
		it("Sets the href URL's hostname.", () => {
			const element = <IHTMLAnchorElement>document.createElement('a');
			element.setAttribute('href', 'https://www.example.com:443/path?q1=a#xyz');

			expect(element.hostname).toBe('www.example.com');

			element.hostname = 'abc.example2.com';
			expect(element.hostname).toBe('abc.example2.com');
			expect(element.href).toBe('https://abc.example2.com/path?q1=a#xyz');
		});

		it("Can't be modified on blob URLs.", () => {
			const element = <IHTMLAnchorElement>document.createElement('a');
			element.href = BLOB_URL;
			element.hostname = 'abc.example2.com';
			expect(element.hostname).toBe('');
		});
	});

	describe('get port()', () => {
		it("Returns the href URL's port.", () => {
			const element = <IHTMLAnchorElement>document.createElement('a');
			element.setAttribute('href', 'https://www.example.com:443/path?q1=a#xyz');
			expect(element.port).toBe('');

			element.setAttribute('href', 'https://www.example.com:444/path?q1=a#xyz');
			expect(element.port).toBe('444');
		});
	});

	describe('set port()', () => {
		it("Sets the href URL's port.", () => {
			const element = <IHTMLAnchorElement>document.createElement('a');
			element.setAttribute('href', 'https://www.example.com:443/path?q1=a#xyz');

			expect(element.port).toBe('');

			element.port = '8080';
			expect(element.port).toBe('8080');
			expect(element.href).toBe('https://www.example.com:8080/path?q1=a#xyz');
		});

		it("Can't be modified on blob URLs.", () => {
			const element = <IHTMLAnchorElement>document.createElement('a');
			element.href = BLOB_URL;
			element.port = '8080';
			expect(element.port).toBe('');
		});
	});

	describe('get pathname()', () => {
		it("Returns the href URL's pathname.", () => {
			const element = <IHTMLAnchorElement>document.createElement('a');
			element.setAttribute('href', 'https://www.example.com:443/path?q1=a#xyz');
			expect(element.pathname).toBe('/path');
		});
	});

	describe('set pathname()', () => {
		it("Sets the href URL's pathname.", () => {
			const element = <IHTMLAnchorElement>document.createElement('a');
			element.setAttribute('href', 'https://www.example.com:443/path?q1=a#xyz');

			expect(element.pathname).toBe('/path');

			element.pathname = '/path2';
			expect(element.pathname).toBe('/path2');
			expect(element.href).toBe('https://www.example.com/path2?q1=a#xyz');
		});

		it("Can't be modified on blob URLs.", () => {
			const element = <IHTMLAnchorElement>document.createElement('a');
			element.href = BLOB_URL;
			element.pathname = '/path2';
			expect(element.pathname).toBe(BLOB_URL.split(':').slice(1).join(':'));
		});
	});

	describe('get search()', () => {
		it("Returns the href URL's search.", () => {
			const element = <IHTMLAnchorElement>document.createElement('a');
			element.setAttribute('href', 'https://www.example.com:443/path?q1=a#xyz');
			expect(element.search).toBe('?q1=a');
		});
	});

	describe('set search()', () => {
		it("Sets the href URL's search.", () => {
			const element = <IHTMLAnchorElement>document.createElement('a');
			element.setAttribute('href', 'https://www.example.com:443/path?q1=a#xyz');

			expect(element.search).toBe('?q1=a');

			element.search = '?q1=b';
			expect(element.search).toBe('?q1=b');
			expect(element.href).toBe('https://www.example.com/path?q1=b#xyz');
		});

		it("Can't be modified on blob URLs.", () => {
			const element = <IHTMLAnchorElement>document.createElement('a');
			element.href = BLOB_URL;
			element.search = '?q1=b';
			expect(element.search).toBe('');
		});
	});

	describe('get hash()', () => {
		it("Returns the href URL's hash.", () => {
			const element = <IHTMLAnchorElement>document.createElement('a');
			element.setAttribute('href', 'https://www.example.com:443/path?q1=a#xyz');
			expect(element.hash).toBe('#xyz');
		});
	});

	describe('set hash()', () => {
		it("Sets the href URL's hash.", () => {
			const element = <IHTMLAnchorElement>document.createElement('a');
			element.setAttribute('href', 'https://www.example.com:443/path?q1=a#xyz');

			expect(element.hash).toBe('#xyz');

			element.hash = '#fgh';
			expect(element.hash).toBe('#fgh');
			expect(element.href).toBe('https://www.example.com/path?q1=a#fgh');
		});

		it('Can be modified on blob URLs.', () => {
			const element = <IHTMLAnchorElement>document.createElement('a');
			element.href = BLOB_URL;
			element.hash = '#fgh';
			expect(element.hash).toBe('');
		});
	});

	describe('dispatchEvent()', () => {
		it('Navigates the browser when a "click" event is dispatched on an element.', async () => {
			const browser = new Browser();
			const page = browser.newPage();
			const window = page.mainFrame.window;

			vi.spyOn(Fetch.prototype, 'send').mockImplementation(function (): Promise<IResponse> {
				return Promise.resolve(<IResponse>{
					text: () => Promise.resolve('Test')
				});
			});

			const element = <IHTMLAnchorElement>window.document.createElement('a');
			element.href = 'https://www.example.com';
			window.document.body.appendChild(element);
			element.dispatchEvent(new PointerEvent('click'));

			const newWindow = page.mainFrame.window;

			expect(newWindow === window).toBe(false);
			expect(newWindow.location.href).toBe('https://www.example.com/');

			await browser.waitUntilComplete();

			expect(newWindow.document.body.innerHTML).toBe('Test');

			newWindow.close();

			expect(newWindow.closed).toBe(true);
		});

		it('Navigates the browser when a "click" event is dispatched on an element with target "_blank".', async () => {
			const browser = new Browser();
			const page = browser.newPage();
			const window = page.mainFrame.window;

			vi.spyOn(Fetch.prototype, 'send').mockImplementation(function (): Promise<IResponse> {
				return Promise.resolve(<IResponse>{
					text: () => Promise.resolve('Test')
				});
			});

			const element = <IHTMLAnchorElement>window.document.createElement('a');
			element.href = 'https://www.example.com';
			element.target = '_blank';
			window.document.body.appendChild(element);
			element.dispatchEvent(new PointerEvent('click'));

			const newWindow = browser.defaultContext.pages[1].mainFrame.window;

			expect(newWindow === window).toBe(false);
			expect(newWindow.location.href).toBe('https://www.example.com/');

			await browser.waitUntilComplete();

			expect(newWindow.document.body.innerHTML).toBe('Test');

			newWindow.close();

			expect(newWindow.closed).toBe(true);
		});

		it('Navigates the browser when a "click" event is dispatched on an element, even if the element is not connected to DOM.', async () => {
			const browser = new Browser();
			const page = browser.newPage();
			const window = page.mainFrame.window;

			vi.spyOn(Fetch.prototype, 'send').mockImplementation(function (): Promise<IResponse> {
				return Promise.resolve(<IResponse>{
					text: () => Promise.resolve('Test')
				});
			});

			const element = <IHTMLAnchorElement>window.document.createElement('a');
			element.href = 'https://www.example.com';
			element.dispatchEvent(new PointerEvent('click'));

			const newWindow = page.mainFrame.window;

			expect(newWindow === window).toBe(false);
			expect(newWindow.location.href).toBe('https://www.example.com/');

			await browser.waitUntilComplete();

			expect(newWindow.document.body.innerHTML).toBe('Test');
		});

		it(`Doesn't navigate or change the location when a "click" event is dispatched inside the main frame of a detached browser when the Happy DOM setting "navigation.disableFallbackToSetURL" is set to "true".`, () => {
			const window = new Window({
				settings: {
					navigation: {
						disableFallbackToSetURL: true
					}
				}
			});
			document = window.document;

			vi.spyOn(Fetch.prototype, 'send').mockImplementation(function (): Promise<IResponse> {
				throw new Error('Fetch should not be called.');
			});

			const element = <IHTMLAnchorElement>document.createElement('a');
			element.href = 'https://www.example.com';
			document.body.appendChild(element);
			element.dispatchEvent(new PointerEvent('click'));
			expect(window.location.href).toBe('about:blank');
		});

		it(`Doesn't navigate, but changes the location of a new window when a "click" event is dispatched inside the main frame of a detached browser when the Happy DOM setting "navigation.disableFallbackToSetURL" is set to "false" and "navigation.disableChildPageNavigation" is set to "true".`, () => {
			const window = new Window({
				settings: {
					navigation: {
						disableFallbackToSetURL: false,
						disableChildPageNavigation: true
					}
				}
			});
			document = window.document;

			vi.spyOn(Fetch.prototype, 'send').mockImplementation(function (): Promise<IResponse> {
				throw new Error('Fetch should not be called.');
			});

			const newWindow = <IWindow>window.open();

			const element = <IHTMLAnchorElement>newWindow.document.createElement('a');
			element.href = 'https://www.example.com';
			newWindow.document.body.appendChild(element);
			element.dispatchEvent(new PointerEvent('click'));
			expect(newWindow.closed).toBe(false);
			expect(newWindow.location.href).toBe('https://www.example.com/');
		});

		it('Changes the location when a "click" event is dispatched inside the main frame of a detached browser when the Happy DOM setting "navigation.disableFallbackToSetURL" is set to "false".', () => {
			const window = new Window({
				settings: {
					navigation: {
						disableFallbackToSetURL: false
					}
				}
			});
			document = window.document;

			vi.spyOn(Fetch.prototype, 'send').mockImplementation(function (): Promise<IResponse> {
				throw new Error('Fetch should not be called.');
			});

			const element = <IHTMLAnchorElement>document.createElement('a');
			element.href = 'https://www.example.com';
			document.body.appendChild(element);
			element.dispatchEvent(new PointerEvent('click'));
			expect(window.location.href).toBe('https://www.example.com/');
		});

		it('Opens a window when a "click" event is dispatched on an element with target set to "_blank" inside the main frame of a detached browser.', () => {
			let request: IRequest | null = null;

			vi.spyOn(Fetch.prototype, 'send').mockImplementation(function (): Promise<IResponse> {
				request = <IRequest>this.request;
				return Promise.resolve(<IResponse>{
					text: () => Promise.resolve('Test')
				});
			});

			const element = <IHTMLAnchorElement>document.createElement('a');
			element.target = '_blank';
			element.href = 'https://www.example.com';
			document.body.appendChild(element);
			element.dispatchEvent(new PointerEvent('click'));
			expect((<IRequest>(<unknown>request)).url).toBe('https://www.example.com/');
		});

		it('Navigates the browser when a "click" event is dispatched on an element inside a non-main frame of a detached browser.', () => {
			let request: IRequest | null = null;

			vi.spyOn(Fetch.prototype, 'send').mockImplementation(function (): Promise<IResponse> {
				request = <IRequest>this.request;
				return Promise.resolve(<IResponse>{
					text: () => Promise.resolve('Test')
				});
			});

			const newWindow = <IWindow>window.open();

			const element = <IHTMLAnchorElement>newWindow.document.createElement('a');
			element.href = 'https://www.example.com';
			newWindow.document.body.appendChild(element);
			element.dispatchEvent(new PointerEvent('click'));
			expect((<IRequest>(<unknown>request)).url).toBe('https://www.example.com/');
			expect(newWindow.closed).toBe(true);
		});
	});
});
