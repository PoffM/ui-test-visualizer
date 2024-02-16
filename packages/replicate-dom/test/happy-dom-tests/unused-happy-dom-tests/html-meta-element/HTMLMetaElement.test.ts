/*
  This file is derived from:
  https://github.com/capricorn86/happy-dom/blob/6cbcc10a1a227b36e38a7bc33203b2ae029cca95/packages/happy-dom/test/nodes/html-meta-element/HTMLMetaElement.test.ts ,
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
import Document from '../../../src/nodes/document/Document.js';
import IHTMLMetaElement from '../../../src/nodes/html-meta-element/IHTMLMetaElement.js';
import { beforeEach, describe, it, expect } from 'vitest';

describe('HTMLMetaElement', () => {
	let window: Window;
	let document: Document;
	let element: IHTMLMetaElement;

	beforeEach(() => {
		window = new Window();
		document = window.document;
		element = <IHTMLMetaElement>document.createElement('meta');
	});

	describe('Object.prototype.toString', () => {
		it('Returns `[object HTMLMetaElement]`', () => {
			expect(Object.prototype.toString.call(element)).toBe('[object HTMLMetaElement]');
		});
	});

	describe('get content()', () => {
		it('Returns attribute value.', () => {
			expect(element.content).toBe('');
			element.setAttribute('content', 'value');
			expect(element.content).toBe('value');
		});
	});

	describe('set content()', () => {
		it('Sets attribute value.', () => {
			element.content = 'value';
			expect(element.getAttribute('content')).toBe('value');
		});
	});

	describe('get httpEquiv()', () => {
		it('Returns attribute value.', () => {
			expect(element.httpEquiv).toBe('');
			element.setAttribute('http-equiv', 'value');
			expect(element.httpEquiv).toBe('value');
		});
	});

	describe('set httpEquiv()', () => {
		it('Sets attribute value.', () => {
			element.httpEquiv = 'value';
			expect(element.getAttribute('http-equiv')).toBe('value');
		});
	});

	describe('get name()', () => {
		it('Returns attribute value.', () => {
			expect(element.name).toBe('');
			element.setAttribute('name', 'value');
			expect(element.name).toBe('value');
		});
	});

	describe('set name()', () => {
		it('Sets attribute value.', () => {
			element.name = 'value';
			expect(element.getAttribute('name')).toBe('value');
		});
	});

	describe('get scheme()', () => {
		it('Returns attribute value.', () => {
			expect(element.scheme).toBe('');
			element.setAttribute('scheme', 'value');
			expect(element.scheme).toBe('value');
		});
	});

	describe('set scheme()', () => {
		it('Sets attribute value.', () => {
			element.scheme = 'value';
			expect(element.getAttribute('scheme')).toBe('value');
		});
	});
});
