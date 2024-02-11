/*
  This file is derived from:
  https://github.com/capricorn86/happy-dom/blob/6cbcc10a1a227b36e38a7bc33203b2ae029cca95/packages/happy-dom/test/nodes/child-node/ChildNodeUtility.test.ts ,
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
import ChildNodeUtility from '../../../src/nodes/child-node/ChildNodeUtility.js';
import { beforeEach, describe, it, expect } from 'vitest';

describe('ChildNodeUtility', () => {
	let window: Window;
	let document: Document;

	beforeEach(() => {
		window = new Window();
		document = window.document;
	});

	describe('remove()', () => {
		it('Removes a node.', () => {
			const parent = document.createElement('div');
			const node = document.createComment('test');
			parent.appendChild(node);
			ChildNodeUtility.remove(node);
			expect(node.parentNode).toBe(null);
			expect(parent.childNodes.length).toBe(0);
		});
	});

	describe('replaceWith()', () => {
		it('Replaces a node with another node.', () => {
			const parent = document.createElement('div');
			const newChild = document.createElement('span');
			newChild.className = 'child4';
			parent.innerHTML =
				'<span class="child1"></span><span class="child2"></span><span class="child3"></span>';

			ChildNodeUtility.replaceWith(parent.children[2], newChild);
			expect(parent.innerHTML).toBe(
				'<span class="child1"></span><span class="child2"></span><span class="child4"></span>'
			);
			expect(parent.children.map((element) => element.outerHTML).join('')).toBe(
				'<span class="child1"></span><span class="child2"></span><span class="child4"></span>'
			);
		});

		it('Replaces a node with a mixed list of Node and DOMString (string).', () => {
			const parent = document.createElement('div');
			const newChildrenParent = document.createElement('div');
			const newChildrenHtml =
				'<span class="child4"></span><span class="child5"></span><span class="child6"></span>';
			newChildrenParent.innerHTML =
				'<span class="child7"></span><span class="child8"></span><span class="child9"></span>';
			parent.innerHTML =
				'<span class="child1"></span><span class="child2"></span><span class="child3"></span>';

			ChildNodeUtility.replaceWith(
				parent.children[2],
				...[newChildrenHtml, ...newChildrenParent.children]
			);
			expect(parent.innerHTML).toBe(
				'<span class="child1"></span><span class="child2"></span><span class="child4"></span><span class="child5"></span><span class="child6"></span><span class="child7"></span><span class="child8"></span><span class="child9"></span>'
			);
			expect(parent.children.map((element) => element.outerHTML).join('')).toBe(
				'<span class="child1"></span><span class="child2"></span><span class="child4"></span><span class="child5"></span><span class="child6"></span><span class="child7"></span><span class="child8"></span><span class="child9"></span>'
			);
		});
	});

	describe('before()', () => {
		it('Inserts a node before the child node.', () => {
			const parent = document.createElement('div');
			const newChild = document.createElement('span');
			newChild.className = 'child4';
			parent.innerHTML =
				'<span class="child1"></span><span class="child2"></span><span class="child3"></span>';

			ChildNodeUtility.before(parent.children[2], newChild);
			expect(parent.innerHTML).toBe(
				'<span class="child1"></span><span class="child2"></span><span class="child4"></span><span class="child3"></span>'
			);
			expect(parent.children.map((element) => element.outerHTML).join('')).toBe(
				'<span class="child1"></span><span class="child2"></span><span class="child4"></span><span class="child3"></span>'
			);
		});

		it('Inserts a mixed list of Node and DOMString (string) before the child node.', () => {
			const parent = document.createElement('div');
			const newChildrenParent = document.createElement('div');
			const newChildrenHtml =
				'<span class="child4"></span><span class="child5"></span><span class="child6"></span>';
			newChildrenParent.innerHTML =
				'<span class="child7"></span><span class="child8"></span><span class="child9"></span>';
			parent.innerHTML =
				'<span class="child1"></span><span class="child2"></span><span class="child3"></span>';

			ChildNodeUtility.before(
				parent.children[2],
				...[newChildrenHtml, ...newChildrenParent.children]
			);
			expect(parent.innerHTML).toBe(
				'<span class="child1"></span><span class="child2"></span><span class="child4"></span><span class="child5"></span><span class="child6"></span><span class="child7"></span><span class="child8"></span><span class="child9"></span><span class="child3"></span>'
			);
			expect(parent.children.map((element) => element.outerHTML).join('')).toBe(
				'<span class="child1"></span><span class="child2"></span><span class="child4"></span><span class="child5"></span><span class="child6"></span><span class="child7"></span><span class="child8"></span><span class="child9"></span><span class="child3"></span>'
			);
		});
	});

	describe('after()', () => {
		it('Inserts a node after the child node by appending the new node.', () => {
			const parent = document.createElement('div');
			const newChild = document.createElement('span');
			newChild.className = 'child4';
			parent.innerHTML =
				'<span class="child1"></span><span class="child2"></span><span class="child3"></span>';

			ChildNodeUtility.after(parent.children[2], newChild);
			expect(parent.innerHTML).toBe(
				'<span class="child1"></span><span class="child2"></span><span class="child3"></span><span class="child4"></span>'
			);
			expect(parent.children.map((element) => element.outerHTML).join('')).toBe(
				'<span class="child1"></span><span class="child2"></span><span class="child3"></span><span class="child4"></span>'
			);
		});

		it('Inserts a node after the child node by inserting the new node.', () => {
			const parent = document.createElement('div');
			const newChild = document.createElement('span');
			newChild.className = 'child4';
			parent.innerHTML =
				'<span class="child1"></span><span class="child2"></span><span class="child3"></span>';

			ChildNodeUtility.after(parent.children[1], newChild);
			expect(parent.innerHTML).toBe(
				'<span class="child1"></span><span class="child2"></span><span class="child4"></span><span class="child3"></span>'
			);
			expect(parent.children.map((element) => element.outerHTML).join('')).toBe(
				'<span class="child1"></span><span class="child2"></span><span class="child4"></span><span class="child3"></span>'
			);
		});

		it('Inserts a mixed list of Node and DOMString (string) after the child node by appending the new nodes.', () => {
			const parent = document.createElement('div');
			const newChildrenParent = document.createElement('div');
			const newChildrenHtml =
				'<span class="child4"></span><span class="child5"></span><span class="child6"></span>';
			newChildrenParent.innerHTML =
				'<span class="child7"></span><span class="child8"></span><span class="child9"></span>';
			parent.innerHTML =
				'<span class="child1"></span><span class="child2"></span><span class="child3"></span>';

			ChildNodeUtility.after(
				parent.children[2],
				...[newChildrenHtml, ...newChildrenParent.children]
			);
			expect(parent.innerHTML).toBe(
				'<span class="child1"></span><span class="child2"></span><span class="child3"></span><span class="child4"></span><span class="child5"></span><span class="child6"></span><span class="child7"></span><span class="child8"></span><span class="child9"></span>'
			);
			expect(parent.children.map((element) => element.outerHTML).join('')).toBe(
				'<span class="child1"></span><span class="child2"></span><span class="child3"></span><span class="child4"></span><span class="child5"></span><span class="child6"></span><span class="child7"></span><span class="child8"></span><span class="child9"></span>'
			);
		});
	});
});
