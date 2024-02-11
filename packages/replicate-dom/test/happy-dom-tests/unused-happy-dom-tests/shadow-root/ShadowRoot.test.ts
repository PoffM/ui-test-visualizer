/*
  This file is derived from:
  https://github.com/capricorn86/happy-dom/blob/6cbcc10a1a227b36e38a7bc33203b2ae029cca95/packages/happy-dom/test/nodes/shadow-root/ShadowRoot.test.ts ,
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

import IHTMLElement from '../../../src/nodes/html-element/IHTMLElement.js';
import Window from '../../../src/window/Window.js';
import Document from '../../../src/nodes/document/Document.js';
import CustomElement from '../../CustomElement.js';
import { beforeEach, describe, it, expect } from 'vitest';

describe('ShadowRoot', () => {
	let window: Window;
	let document: Document;

	beforeEach(() => {
		window = new Window();
		document = window.document;
		window.customElements.define('custom-element', CustomElement);
	});

	describe('set innerHTML()', () => {
		it('Sets the innerHTML of the shadow root.', () => {
			const shadowRoot = document.createElement('custom-element').shadowRoot;
			shadowRoot.innerHTML = '<div attr1="value1" attr2="value2"><span>Test</span></div>';
			expect(shadowRoot.childNodes.length).toBe(1);
			expect(shadowRoot.childNodes[0].childNodes.length).toBe(1);
			expect((<IHTMLElement>shadowRoot.childNodes[0]).tagName).toBe('DIV');
			expect((<IHTMLElement>shadowRoot.childNodes[0].childNodes[0]).tagName).toBe('SPAN');
		});
	});

	describe('get innerHTML()', () => {
		it('Returns the innerHTML of the shadow root.', () => {
			const html = '<div attr1="value1" attr2="value2"><span>Test</span></div>';
			const shadowRoot = document.createElement('custom-element').shadowRoot;
			shadowRoot.innerHTML = html;
			expect(shadowRoot.innerHTML).toBe(html);
		});
	});

	describe('get activeElement()', () => {
		it('Returns the currently active element within the ShadowRoot.', () => {
			const customElement = document.createElement('custom-element');
			const shadowRoot = customElement.shadowRoot;
			const div = <IHTMLElement>document.createElement('div');
			const span = <IHTMLElement>document.createElement('span');

			document.body.appendChild(customElement);

			shadowRoot.appendChild(div);
			shadowRoot.appendChild(span);

			expect(shadowRoot.activeElement === null).toBe(true);

			div.focus();

			expect(shadowRoot.activeElement === div).toBe(true);

			span.focus();

			expect(shadowRoot.activeElement === span).toBe(true);

			span.blur();

			expect(shadowRoot.activeElement === null).toBe(true);

			document.body.appendChild(span);

			span.focus();

			expect(shadowRoot.activeElement === null).toBe(true);
		});

		it('Unsets the active element when it gets disconnected.', () => {
			const customElement = document.createElement('custom-element');
			const shadowRoot = customElement.shadowRoot;
			const div = <IHTMLElement>document.createElement('div');

			document.body.appendChild(customElement);

			shadowRoot.appendChild(div);

			expect(shadowRoot.activeElement === null).toBe(true);

			div.focus();

			expect(shadowRoot.activeElement === div).toBe(true);

			customElement.remove();

			expect(shadowRoot.activeElement === null).toBe(true);
		});
	});

	describe('toString()', () => {
		it('Returns the innerHTML of the shadow root.', () => {
			const html = '<div attr1="value1" attr2="value2"><span>Test</span></div>';
			const shadowRoot = document.createElement('custom-element').shadowRoot;
			shadowRoot.innerHTML = html;
			expect(shadowRoot.toString()).toBe(html);
		});
	});

	describe('cloneNode()', () => {
		it('Clones the value of the "mode" property when cloned.', () => {
			const shadowRoot = document.createElement('custom-element').shadowRoot;
			const clone = shadowRoot.cloneNode();
			expect(shadowRoot.mode).toBe('open');
			expect(clone.mode).toBe('open');
		});
	});
});
