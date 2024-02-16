/*
  This file is derived from:
  https://github.com/capricorn86/happy-dom/blob/6cbcc10a1a227b36e38a7bc33203b2ae029cca95/packages/happy-dom/test/nodes/html-label-element/HTMLLabelElement.test.ts ,
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
import IHTMLLabelElement from '../../../src/nodes/html-label-element/IHTMLLabelElement.js';
import IHTMLInputElement from '../../../src/nodes/html-input-element/IHTMLInputElement.js';
import PointerEvent from '../../../src/event/events/PointerEvent.js';
import { beforeEach, describe, it, expect } from 'vitest';

describe('HTMLLabelElement', () => {
	let window: Window;
	let document: Document;
	let element: IHTMLLabelElement;

	beforeEach(() => {
		window = new Window();
		document = window.document;
		element = <IHTMLLabelElement>document.createElement('label');
	});

	describe('Object.prototype.toString', () => {
		it('Returns `[object HTMLLabelElement]`', () => {
			expect(Object.prototype.toString.call(element)).toBe('[object HTMLLabelElement]');
		});
	});

	describe('get htmlFor()', () => {
		it('Returns attribute value.', () => {
			expect(element.htmlFor).toBe('');
			element.setAttribute('for', 'value');
			expect(element.htmlFor).toBe('value');
		});
	});

	describe('set htmlFor()', () => {
		it('Sets attribute value.', () => {
			element.htmlFor = 'value';
			expect(element.getAttribute('for')).toBe('value');
		});
	});

	describe('get control()', () => {
		it('Returns element controlling the label when "for" attribute has been defined.', () => {
			const input = document.createElement('input');
			input.id = 'inputId';
			element.htmlFor = 'inputId';
			document.appendChild(input);
			document.appendChild(element);
			expect(element.control === input).toBe(true);
		});

		it('Returns input appended as a child if "for" attribute is not defined.', () => {
			const input = document.createElement('input');
			element.appendChild(input);
			expect(element.control === input).toBe(true);
		});

		it('Returns a descendent input if "for" attribute is not defined.', () => {
			const input = document.createElement('input');
			const span = document.createElement('span');
			span.appendChild(input);
			element.appendChild(span);
			expect(element.control === input).toBe(true);
		});

		it('Does not return hidden inputs.', () => {
			const input = document.createElement('input');
			input.setAttribute('type', 'hidden');
			element.appendChild(input);
			expect(element.control).toBe(null);
		});
	});

	describe('get form()', () => {
		it('Returns parent form element.', () => {
			const form = document.createElement('form');
			const div = document.createElement('div');
			div.appendChild(element);
			form.appendChild(div);
			expect(element.form === form).toBe(true);
		});
	});

	describe('dispatchEvent()', () => {
		it('Dispatches a click event on the control element if it exists.', () => {
			const input = <IHTMLInputElement>document.createElement('input');
			const span = document.createElement('span');

			input.type = 'checkbox';

			span.appendChild(input);
			element.appendChild(span);

			let labelClickCount = 0;
			let inputClickCount = 0;

			element.addEventListener('click', () => labelClickCount++);
			input.addEventListener('click', () => inputClickCount++);

			expect(input.checked).toBe(false);

			element.dispatchEvent(new PointerEvent('click'));

			expect(input.checked).toBe(true);
			expect(labelClickCount).toBe(2);
			expect(inputClickCount).toBe(1);
		});
	});
});
