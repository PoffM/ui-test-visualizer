/*
  This file is derived from:
  https://github.com/capricorn86/happy-dom/blob/6cbcc10a1a227b36e38a7bc33203b2ae029cca95/packages/happy-dom/test/nodes/element/HTMLCollection.test.ts ,
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
import { beforeEach, afterEach, describe, it, expect } from 'vitest';

describe('HTMLCollection', () => {
	let window: Window;
	let document: Document;

	beforeEach(() => {
		window = new Window();
		document = window.document;
	});

	describe('item()', () => {
		it('Returns node at index.', () => {
			const div = document.createElement('div');
			const span = document.createElement('span');
			document.body.appendChild(div);
			document.body.appendChild(span);
			expect(document.body.children[0] === div).toBe(true);
			expect(document.body.children[1] === span).toBe(true);
			expect(document.body.children.item(0) === div).toBe(true);
			expect(document.body.children.item(1) === span).toBe(true);
		});
	});

	describe('namedItem()', () => {
		it('Returns named items.', () => {
			const div1 = document.createElement('div');
			const div2 = document.createElement('div');
			const div3 = document.createElement('div');
			const div4 = document.createElement('div');
			const div5 = document.createElement('div');

			div1.id = 'div1';
			div2.setAttribute('name', 'div2');

			document.body.appendChild(div1);
			document.body.appendChild(div2);
			document.body.appendChild(div3);
			document.body.appendChild(div4);
			document.body.appendChild(div5);

			div3.id = 'div3';
			div4.id = 'div3';
			div5.setAttribute('name', 'div3');

			expect(document.body.children['div1'] === div1).toBe(true);
			expect(document.body.children['div2'] === div2).toBe(true);
			expect(document.body.children['div3'] === div3).toBe(true);
			expect(document.body.children.namedItem('div1') === div1).toBe(true);
			expect(document.body.children.namedItem('div2') === div2).toBe(true);
			expect(document.body.children.namedItem('div3') === div3).toBe(true);

			document.body.removeChild(div3);
			document.body.removeChild(div4);

			expect(document.body.children['div1'] === div1).toBe(true);
			expect(document.body.children['div2'] === div2).toBe(true);
			expect(document.body.children['div3'] === div5).toBe(true);
			expect(document.body.children.namedItem('div1') === div1).toBe(true);
			expect(document.body.children.namedItem('div2') === div2).toBe(true);
			expect(document.body.children.namedItem('div3') === div5).toBe(true);

			div5.id = 'div5';

			expect(document.body.children.namedItem('div3') === div5).toBe(true);
			expect(document.body.children.namedItem('div5') === div5).toBe(true);

			div5.removeAttribute('name');

			expect(document.body.children.namedItem('div3') === null).toBe(true);
			expect(document.body.children.namedItem('div5') === div5).toBe(true);
		});

		it('Supports attributes only consisting of numbers.', () => {
			const div = document.createElement('div');
			div.innerHTML = `<div name="container1" class="container1"></div><div name="container2" class="container2"></div><div name="0" class="container3"></div><div name="1" class="container4"></div>`;
			const container1 = div.querySelector('.container1');
			const container2 = div.querySelector('.container2');
			const container3 = div.querySelector('.container3');
			const container4 = div.querySelector('.container4');

			expect(div.children.length).toBe(4);
			expect(div.children[0] === container1).toBe(true);
			expect(div.children[1] === container2).toBe(true);
			expect(div.children[2] === container3).toBe(true);
			expect(div.children[3] === container4).toBe(true);
			expect(div.children.namedItem('container1') === container1).toBe(true);
			expect(div.children.namedItem('container2') === container2).toBe(true);
			expect(div.children.namedItem('0') === container3).toBe(true);
			expect(div.children.namedItem('1') === container4).toBe(true);

			container3.remove();

			expect(div.children.length).toBe(3);
			expect(div.children[0] === container1).toBe(true);
			expect(div.children[1] === container2).toBe(true);
			expect(div.children[2] === container4).toBe(true);
			expect(div.children.namedItem('container1') === container1).toBe(true);
			expect(div.children.namedItem('container2') === container2).toBe(true);
			expect(div.children.namedItem('0') === null).toBe(true);
			expect(div.children.namedItem('1') === container4).toBe(true);

			div.insertBefore(container3, container4);

			expect(div.children.length).toBe(4);
			expect(div.children[0] === container1).toBe(true);
			expect(div.children[1] === container2).toBe(true);
			expect(div.children[2] === container3).toBe(true);
			expect(div.children[3] === container4).toBe(true);
			expect(div.children.namedItem('container1') === container1).toBe(true);
			expect(div.children.namedItem('container2') === container2).toBe(true);
			expect(div.children.namedItem('0') === container3).toBe(true);
			expect(div.children.namedItem('1') === container4).toBe(true);
		});

		it('Supports attributes that has the same name as properties and methods of the HTMLCollection class.', () => {
			const div = document.createElement('div');
			div.innerHTML = `<div name="length" class="container1"></div><div name="namedItem" class="container2"></div><div name="push" class="container3"></div>`;
			const container1 = div.querySelector('.container1');
			const container2 = div.querySelector('.container2');
			const container3 = div.querySelector('.container3');

			expect(div.children.length).toBe(3);
			expect(div.children[0] === container1).toBe(true);
			expect(div.children[1] === container2).toBe(true);
			expect(div.children[2] === container3).toBe(true);
			expect(div.children.namedItem('length') === container1).toBe(true);
			expect(div.children.namedItem('namedItem') === container2).toBe(true);
			expect(div.children.namedItem('push') === container3).toBe(true);

			expect(typeof div.children['namedItem']).toBe('function');
			expect(typeof div.children['push']).toBe('function');

			container2.remove();

			expect(div.children.length).toBe(2);
			expect(div.children[0] === container1).toBe(true);
			expect(div.children[1] === container3).toBe(true);
			expect(div.children.namedItem('length') === container1).toBe(true);
			expect(div.children.namedItem('push') === container3).toBe(true);

			div.insertBefore(container2, container3);

			expect(div.children.length).toBe(3);
			expect(div.children[0] === container1).toBe(true);
			expect(div.children[1] === container2).toBe(true);
			expect(div.children[2] === container3).toBe(true);
			expect(div.children.namedItem('length') === container1).toBe(true);
			expect(div.children.namedItem('namedItem') === container2).toBe(true);
			expect(div.children.namedItem('push') === container3).toBe(true);

			expect(typeof div.children['namedItem']).toBe('function');
			expect(typeof div.children['push']).toBe('function');
		});
	});
});
