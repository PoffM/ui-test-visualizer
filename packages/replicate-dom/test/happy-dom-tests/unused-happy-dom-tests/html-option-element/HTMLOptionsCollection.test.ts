/*
  This file is derived from:
  https://github.com/capricorn86/happy-dom/blob/6cbcc10a1a227b36e38a7bc33203b2ae029cca95/packages/happy-dom/test/nodes/html-option-element/HTMLOptionsCollection.test.ts ,
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
import HTMLSelectElement from '../../../src/nodes/html-select-element/HTMLSelectElement.js';
import HTMLOptionElement from '../../../src/nodes/html-option-element/HTMLOptionElement.js';
import DOMException from '../../../src/exception/DOMException.js';
import { beforeEach, afterEach, describe, it, expect } from 'vitest';

describe('HTMLOptionsCollection', () => {
	let window: IWindow;
	let document: IDocument;

	beforeEach(() => {
		window = new Window();
		document = window.document;
	});

	describe('get selectedIndex()', () => {
		it('Returns -1 if there are no options.', () => {
			const select = <HTMLSelectElement>document.createElement('select');
			expect(select.options.selectedIndex).toBe(-1);
		});

		it('Returns 0 by default.', () => {
			const select = <HTMLSelectElement>document.createElement('select');
			const option1 = <HTMLOptionElement>document.createElement('option');
			const option2 = <HTMLOptionElement>document.createElement('option');

			option1.value = 'option1';
			option2.value = 'option2';

			select.appendChild(option1);
			select.appendChild(option2);

			expect(select.options.selectedIndex).toBe(0);
		});
	});

	describe('set selectedIndex()', () => {
		it('Updates option.selected', () => {
			const select = <HTMLSelectElement>document.createElement('select');
			const option1 = <HTMLOptionElement>document.createElement('option');
			const option2 = <HTMLOptionElement>document.createElement('option');

			expect(option1.selected).toBe(false);
			expect(option2.selected).toBe(false);

			select.appendChild(option1);
			select.appendChild(option2);

			expect(option1.selected).toBe(true);
			expect(option2.selected).toBe(false);

			select.options.selectedIndex = 1;

			expect(option1.selected).toBe(false);
			expect(option2.selected).toBe(true);

			select.options.selectedIndex = -1;

			expect(option1.selected).toBe(false);
			expect(option2.selected).toBe(false);
		});
	});

	describe('item()', () => {
		it('Returns node at index.', () => {
			const select = <HTMLSelectElement>document.createElement('select');
			const option = document.createElement('option');
			select.appendChild(option);
			document.body.appendChild(select);
			expect(select.options.item(0) === option).toBe(true);
		});
	});

	describe('add()', () => {
		it('Adds item to the collection.', () => {
			const select = <HTMLSelectElement>document.createElement('select');
			const option = document.createElement('option');
			select.appendChild(option);
			document.body.appendChild(select);
			expect(select.options.item(0) === option).toBe(true);

			const option2 = <HTMLOptionElement>document.createElement('option');
			select.options.add(option2);
			expect(select.options.item(1) === option2).toBe(true);
		});

		it('Throws error when before element doesnt exist.', () => {
			const select = <HTMLSelectElement>document.createElement('select');
			const option = document.createElement('option');
			select.appendChild(option);
			document.body.appendChild(select);
			expect(select.options.item(0) === option).toBe(true);

			const option2 = <HTMLOptionElement>document.createElement('option');
			const optionThatDoesntExist = <HTMLOptionElement>document.createElement('option');
			expect(() => select.options.add(option2, optionThatDoesntExist)).toThrowError(DOMException);
		});

		it('Adds item to defined index.', () => {
			const select = <HTMLSelectElement>document.createElement('select');
			const option = document.createElement('option');
			select.appendChild(option);
			document.body.appendChild(select);
			expect(select.options.item(0) === option).toBe(true);

			const option2 = <HTMLOptionElement>document.createElement('option');
			select.options.add(option2, 0);
			expect(select.options.item(0) === option2).toBe(true);
		});
	});

	describe('remove()', () => {
		it('Removes item from collection.', () => {
			const select = <HTMLSelectElement>document.createElement('select');
			const option = document.createElement('option');
			select.appendChild(option);
			document.body.appendChild(select);
			select.options.remove(0);
			expect(select.options.length).toBe(0);
		});

		it('Changes selectedIndex when element removed from collection.', () => {
			const select = <HTMLSelectElement>document.createElement('select');
			const option = document.createElement('option');
			const option2 = document.createElement('option');

			expect(select.options.selectedIndex).toBe(-1);

			select.appendChild(option);
			select.appendChild(option2);

			expect(select.options.selectedIndex).toBe(0);

			select.options.selectedIndex = 1;
			expect(select.options.selectedIndex).toBe(1);

			select.options.remove(1);
			expect(select.options.selectedIndex).toBe(0);

			select.options.remove(0);
			expect(select.options.selectedIndex).toBe(-1);
		});
	});
});
