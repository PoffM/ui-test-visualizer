/*
  This file is derived from:
  https://github.com/capricorn86/happy-dom/blob/6cbcc10a1a227b36e38a7bc33203b2ae029cca95/packages/happy-dom/test/nodes/svg-element/SVGElement.test.ts ,
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
import ISVGSVGElement from '../../../src/nodes/svg-element/ISVGSVGElement.js';
import NamespaceURI from '../../../src/config/NamespaceURI.js';
import ISVGElement from '../../../src/nodes/svg-element/ISVGElement.js';
import HTMLElementUtility from '../../../src/nodes/html-element/HTMLElementUtility.js';
import { beforeEach, describe, it, expect, vi, afterEach } from 'vitest';
import IHTMLElement from '../../../src/nodes/html-element/IHTMLElement.js';

describe('SVGElement', () => {
	let window: Window;
	let document: Document;
	let element: ISVGSVGElement;
	let line: ISVGElement;

	beforeEach(() => {
		window = new Window();
		document = window.document;
		element = <ISVGSVGElement>document.createElementNS(NamespaceURI.svg, 'svg');
		line = <ISVGElement>document.createElementNS(NamespaceURI.svg, 'line');
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe('get ownerSVGElement()', () => {
		it('Returns svg element when append to some svg.', () => {
			element.append(line);
			const ownerSVG = line.ownerSVGElement;
			expect(ownerSVG).toBe(element);
		});

		it('Returns null when dangling.', () => {
			const ownerSVG = line.ownerSVGElement;
			expect(ownerSVG).toBe(null);
		});
	});

	describe('get dataset()', () => {
		it('Returns a Proxy behaving like an object that can add, remove, set and get element attributes prefixed with "data-".', () => {
			element.setAttribute('test-alpha', 'value1');
			element.setAttribute('data-test-alpha', 'value2');
			element.setAttribute('test-beta', 'value3');
			element.setAttribute('data-test-beta', 'value4');

			const dataset = element.dataset;

			expect(dataset).toBe(element.dataset);
			expect(Object.keys(dataset)).toEqual(['testAlpha', 'testBeta']);
			expect(Object.values(dataset)).toEqual(['value2', 'value4']);

			dataset.testGamma = 'value5';

			expect(element.getAttribute('data-test-gamma')).toBe('value5');
			expect(Object.keys(dataset)).toEqual(['testAlpha', 'testBeta', 'testGamma']);
			expect(Object.values(dataset)).toEqual(['value2', 'value4', 'value5']);

			element.setAttribute('data-test-delta', 'value6');

			expect(dataset.testDelta).toBe('value6');
			expect(Object.keys(dataset)).toEqual(['testAlpha', 'testBeta', 'testGamma', 'testDelta']);
			expect(Object.values(dataset)).toEqual(['value2', 'value4', 'value5', 'value6']);

			delete dataset.testDelta;

			expect(element.getAttribute('data-test-delta')).toBe(null);
			expect(Object.keys(dataset)).toEqual(['testAlpha', 'testBeta', 'testGamma']);
			expect(Object.values(dataset)).toEqual(['value2', 'value4', 'value5']);
		});
	});

	describe('get tabIndex()', () => {
		it('Returns the attribute "tabindex" as a number.', () => {
			element.setAttribute('tabindex', '5');
			expect(element.tabIndex).toBe(5);
		});
	});

	describe('set tabIndex()', () => {
		it('Sets the attribute "tabindex".', () => {
			element.tabIndex = 5;
			expect(element.getAttribute('tabindex')).toBe('5');
		});

		it('Removes the attribute "tabindex" when set to "-1".', () => {
			element.tabIndex = 5;
			element.tabIndex = -1;
			expect(element.getAttribute('tabindex')).toBe(null);
		});
	});

	describe('blur()', () => {
		it('Calls HTMLElementUtility.blur().', () => {
			let blurredElement: ISVGElement | null = null;

			vi.spyOn(HTMLElementUtility, 'blur').mockImplementation(
				(element: ISVGElement | IHTMLElement) => {
					blurredElement = <ISVGElement>element;
				}
			);

			element.blur();

			expect(blurredElement === element).toBe(true);
		});
	});

	describe('focus()', () => {
		it('Calls HTMLElementUtility.focus().', () => {
			let focusedElement: ISVGElement | null = null;

			vi.spyOn(HTMLElementUtility, 'focus').mockImplementation(
				(element: ISVGElement | IHTMLElement) => {
					focusedElement = <ISVGElement>element;
				}
			);

			element.focus();

			expect(focusedElement === element).toBe(true);
		});
	});
});
