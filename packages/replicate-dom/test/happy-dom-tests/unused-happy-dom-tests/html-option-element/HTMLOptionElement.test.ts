/*
  This file is derived from:
  https://github.com/capricorn86/happy-dom/blob/6cbcc10a1a227b36e38a7bc33203b2ae029cca95/packages/happy-dom/test/nodes/html-option-element/HTMLOptionElement.test.ts ,
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
import IHTMLOptionElement from '../../../src/nodes/html-option-element/IHTMLOptionElement.js';
import IHTMLSelectElement from '../../../src/nodes/html-select-element/IHTMLSelectElement.js';
import { beforeEach, describe, it, expect } from 'vitest';

describe('HTMLOptionElement', () => {
	let window: Window;
	let document: Document;
	let element: IHTMLOptionElement;

	beforeEach(() => {
		window = new Window();
		document = window.document;
		element = <IHTMLOptionElement>document.createElement('option');
	});

	describe('Object.prototype.toString', () => {
		it('Returns `[object HTMLOptionElement]`', () => {
			expect(Object.prototype.toString.call(element)).toBe('[object HTMLOptionElement]');
		});
	});

	describe('get value()', () => {
		it('Returns the attribute "value".', () => {
			element.setAttribute('value', 'VALUE');
			expect(element.value).toBe('VALUE');
		});

		it('Returns the text IDL value if no attribute is present.', () => {
			element.removeAttribute('value');
			element.textContent = 'TEXT VALUE';
			expect(element.value).toBe('TEXT VALUE');
		});
	});

	describe('set value()', () => {
		it('Sets the attribute "value".', () => {
			element.value = 'VALUE';
			expect(element.getAttribute('value')).toBe('VALUE');
		});
	});

	describe('get disabled()', () => {
		it('Returns the attribute "disabled".', () => {
			element.setAttribute('disabled', '');
			expect(element.disabled).toBe(true);
		});
	});

	describe('set disabled()', () => {
		it('Sets the attribute "disabled".', () => {
			element.disabled = true;
			expect(element.getAttribute('disabled')).toBe('');
		});
	});

	describe('get selected()', () => {
		it('Returns the selected state of the option.', () => {
			const select = <IHTMLSelectElement>document.createElement('select');
			const option1 = <IHTMLOptionElement>document.createElement('option');
			const option2 = <IHTMLOptionElement>document.createElement('option');

			expect(option1.selected).toBe(false);
			expect(option2.selected).toBe(false);

			select.appendChild(option1);
			select.appendChild(option2);

			expect(option1.selected).toBe(true);
			expect(option2.selected).toBe(false);
			expect(option1.getAttribute('selected')).toBe(null);
			expect(option2.getAttribute('selected')).toBe(null);

			select.options.selectedIndex = 1;

			expect(option1.selected).toBe(false);
			expect(option2.selected).toBe(true);
			expect(option1.getAttribute('selected')).toBe(null);
			expect(option2.getAttribute('selected')).toBe(null);

			select.options.selectedIndex = -1;

			expect(option1.selected).toBe(false);
			expect(option2.selected).toBe(false);
		});
	});

	describe('set selected()', () => {
		it('Sets the selected state of the option.', () => {
			const select = <IHTMLSelectElement>document.createElement('select');
			const option1 = <IHTMLOptionElement>document.createElement('option');
			const option2 = <IHTMLOptionElement>document.createElement('option');

			expect(option1.selected).toBe(false);
			expect(option2.selected).toBe(false);

			option1.selected = true;

			expect(select.selectedIndex).toBe(-1);

			select.appendChild(option1);
			select.appendChild(option2);

			option1.selected = true;

			expect(select.selectedIndex).toBe(0);

			option2.selected = true;

			expect(select.selectedIndex).toBe(1);

			option2.selected = false;

			expect(select.selectedIndex).toBe(0);
		});
	});
});
