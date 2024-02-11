/*
  This file is derived from:
  https://github.com/capricorn86/happy-dom/blob/6cbcc10a1a227b36e38a7bc33203b2ae029cca95/packages/happy-dom/test/nodes/html-base-element/HTMLBaseElement.test.ts ,
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
import IHTMLBaseElement from '../../../src/nodes/html-base-element/IHTMLBaseElement.js';
import { beforeEach, afterEach, describe, it, expect } from 'vitest';

describe('HTMLBaseElement', () => {
	let window: IWindow;
	let document: IDocument;

	beforeEach(() => {
		window = new Window();
		document = window.document;
	});

	describe('get target()', () => {
		it('Returns the "target" attribute.', () => {
			const element = <IHTMLBaseElement>document.createElement('base');
			element.setAttribute('target', 'test');
			expect(element.target).toBe('test');
		});
	});

	describe('set target()', () => {
		it('Sets the attribute "target".', () => {
			const element = <IHTMLBaseElement>document.createElement('base');
			element.target = 'test';
			expect(element.getAttribute('target')).toBe('test');
		});
	});

	describe('get href()', () => {
		it('Returns the "href" attribute.', () => {
			const element = <IHTMLBaseElement>document.createElement('base');
			element.setAttribute('href', 'test');
			expect(element.href).toBe('test');
		});

		it('Returns location.href if not set.', () => {
			const element = <IHTMLBaseElement>document.createElement('base');
			document.location.href = 'https://localhost:8080/base/path/to/script/?key=value=1#test';
			expect(element.href).toBe('https://localhost:8080/base/path/to/script/?key=value=1#test');
		});
	});

	describe('set href()', () => {
		it('Sets the attribute "href".', () => {
			const element = <IHTMLBaseElement>document.createElement('base');
			element.href = 'test';
			expect(element.getAttribute('href')).toBe('test');
		});
	});
});
