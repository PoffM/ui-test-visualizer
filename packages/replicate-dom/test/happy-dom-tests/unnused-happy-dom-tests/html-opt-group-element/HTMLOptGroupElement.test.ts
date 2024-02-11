/*
  This file is derived from:
  https://github.com/capricorn86/happy-dom/blob/6cbcc10a1a227b36e38a7bc33203b2ae029cca95/packages/happy-dom/test/nodes/html-opt-group-element/HTMLOptGroupElement.test.ts ,
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
import HTMLOptGroupElement from '../../../src/nodes/html-opt-group-element/HTMLOptGroupElement.js';
import { beforeEach, describe, it, expect } from 'vitest';

describe('HTMLOptGroupElement', () => {
	let window: Window;
	let document: Document;
	let element: HTMLOptGroupElement;

	beforeEach(() => {
		window = new Window();
		document = window.document;
		element = <HTMLOptGroupElement>document.createElement('optgroup');
	});

	describe('Object.prototype.toString', () => {
		it('Returns `[object HTMLOptGroupElement]`', () => {
			expect(Object.prototype.toString.call(element)).toBe('[object HTMLOptGroupElement]');
		});
	});

	describe(`get disabled()`, () => {
		it('Returns attribute value.', () => {
			expect(element.disabled).toBe(false);
			element.setAttribute('disabled', '');
			expect(element.disabled).toBe(true);
		});
	});

	describe(`set disabled()`, () => {
		it('Sets attribute value.', () => {
			element.disabled = true;
			expect(element.getAttribute('disabled')).toBe('');
		});
	});

	describe(`get label()`, () => {
		it('Returns attribute value.', () => {
			expect(element.label).toBe('');
			element.setAttribute('label', 'value');
			expect(element.label).toBe('value');
		});
	});

	describe(`set label()`, () => {
		it('Sets attribute value.', () => {
			element.label = 'value';
			expect(element.getAttribute('label')).toBe('value');
		});
	});
});
