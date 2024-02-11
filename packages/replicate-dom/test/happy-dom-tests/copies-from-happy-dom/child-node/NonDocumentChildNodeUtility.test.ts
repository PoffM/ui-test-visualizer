/*
  This file is derived from:
  https://github.com/capricorn86/happy-dom/blob/6cbcc10a1a227b36e38a7bc33203b2ae029cca95/packages/happy-dom/test/nodes/child-node/NonDocumentChildNodeUtility.test.ts ,
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
import NonDocumentChildNodeUtility from '../../../src/nodes/child-node/NonDocumentChildNodeUtility.js';
import { beforeEach, describe, it, expect } from 'vitest';

describe('NonDocumentChildNodeUtility', () => {
	let window: Window;
	let document: Document;

	beforeEach(() => {
		window = new Window();
		document = window.document;
	});

	describe('previousElementSibling()', () => {
		it('Returns the previous element sibling.', () => {
			const parent = document.createElement('div');
			const comment = document.createComment('test');
			const element1 = document.createElement('div');
			const element2 = document.createElement('div');

			parent.appendChild(element1);
			parent.appendChild(comment);
			parent.appendChild(element2);

			expect(NonDocumentChildNodeUtility.previousElementSibling(comment)).toBe(element1);
		});
	});

	describe('nextElementSibling()', () => {
		it('Returns the next element sibling.', () => {
			const parent = document.createElement('div');
			const comment = document.createComment('test');
			const element1 = document.createElement('div');
			const element2 = document.createElement('div');

			parent.appendChild(element1);
			parent.appendChild(comment);
			parent.appendChild(element2);

			expect(NonDocumentChildNodeUtility.nextElementSibling(comment)).toBe(element2);
		});
	});
});
