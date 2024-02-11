/*
  This file is derived from:
  https://github.com/capricorn86/happy-dom/blob/6cbcc10a1a227b36e38a7bc33203b2ae029cca95/packages/happy-dom/test/nodes/html-slot-element/HTMLSlotElement.test.ts ,
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
import IHTMLSlotElement from '../../../src/nodes/html-slot-element/IHTMLSlotElement.js';
import CustomElementWithNamedSlots from './CustomElementWithNamedSlots.js';
import CustomElementWithSlot from './CustomElementWithSlot.js';
import INodeList from '../../../src/nodes/node/INodeList.js';
import { beforeEach, describe, it, expect } from 'vitest';

describe('HTMLSlotElement', () => {
	let window: Window;
	let document: Document;
	let customElementWithNamedSlots: CustomElementWithNamedSlots;
	let customElementWithSlot: CustomElementWithSlot;

	beforeEach(() => {
		window = new Window();
		document = window.document;

		window.customElements.define('custom-element-with-named-slots', CustomElementWithNamedSlots);
		window.customElements.define('custom-element-with-slot', CustomElementWithSlot);

		customElementWithNamedSlots = <CustomElementWithNamedSlots>(
			document.createElement('custom-element-with-named-slots')
		);
		customElementWithSlot = <CustomElementWithSlot>(
			document.createElement('custom-element-with-slot')
		);

		document.body.appendChild(customElementWithNamedSlots);
		document.body.appendChild(customElementWithSlot);
	});

	describe('get name()', () => {
		it('Returns attribute value.', () => {
			const slot = <IHTMLSlotElement>customElementWithSlot.shadowRoot.querySelector('slot');
			expect(slot.name).toBe('');
			slot.setAttribute('name', 'value');
			expect(slot.name).toBe('value');
		});
	});

	describe('set name()', () => {
		it('Sets attribute value.', () => {
			const slot = <IHTMLSlotElement>customElementWithSlot.shadowRoot.querySelector('slot');
			slot.name = 'value';
			expect(slot.getAttribute('name')).toBe('value');
		});
	});

	describe('assign()', () => {
		it("Sets the slot's manually assigned nodes to an ordered set of slottables.", () => {
			const slot = <IHTMLSlotElement>customElementWithSlot.shadowRoot.querySelector('slot');
			// TODO: Do nothing for now. We need to find an example of how it is expected to work before it can be implemented.
			expect(slot.assign()).toBe(undefined);
		});
	});

	describe('assignedNodes()', () => {
		it('Returns nodes appended to the custom element.', () => {
			const slot = <IHTMLSlotElement>customElementWithSlot.shadowRoot.querySelector('slot');
			const text = document.createTextNode('text');
			const comment = document.createComment('text');
			const div = document.createElement('div');
			const span = document.createElement('span');

			customElementWithSlot.appendChild(text);
			customElementWithSlot.appendChild(comment);
			customElementWithSlot.appendChild(div);
			customElementWithSlot.appendChild(span);

			expect(slot.assignedNodes()).toEqual(customElementWithSlot.childNodes);
		});

		it('Only return elements that has the proeprty "slot" set to the same value as the property "name" of the slot.', () => {
			const text = document.createTextNode('text');
			const comment = document.createComment('text');
			const div = document.createElement('div');
			const span = document.createElement('span');

			div.slot = 'slot1';

			customElementWithNamedSlots.appendChild(text);
			customElementWithNamedSlots.appendChild(comment);
			customElementWithNamedSlots.appendChild(div);
			customElementWithNamedSlots.appendChild(span);

			const slots = <INodeList<IHTMLSlotElement>>(
				customElementWithNamedSlots.shadowRoot.querySelectorAll('slot')
			);

			expect(slots[0].assignedNodes()).toEqual([div]);
			expect(slots[1].assignedNodes()).toEqual([]);
		});
	});

	describe('assignedElements()', () => {
		it('Returns elements appended to the custom element.', () => {
			const slot = <IHTMLSlotElement>customElementWithSlot.shadowRoot.querySelector('slot');
			const text = document.createTextNode('text');
			const comment = document.createComment('text');
			const div = document.createElement('div');
			const span = document.createElement('span');

			customElementWithSlot.appendChild(text);
			customElementWithSlot.appendChild(comment);
			customElementWithSlot.appendChild(div);
			customElementWithSlot.appendChild(span);

			expect(slot.assignedElements()).toEqual(customElementWithSlot.children);
		});

		it('Only return elements that has the proeprty "slot" set to the same value as the property "name" of the slot.', () => {
			const text = document.createTextNode('text');
			const comment = document.createComment('text');
			const div = document.createElement('div');
			const span1 = document.createElement('span');
			const span2 = document.createElement('span');

			div.slot = 'slot1';
			span1.slot = 'slot1';
			span2.slot = 'slot2';

			customElementWithNamedSlots.appendChild(text);
			customElementWithNamedSlots.appendChild(comment);
			customElementWithNamedSlots.appendChild(div);
			customElementWithNamedSlots.appendChild(span1);
			customElementWithNamedSlots.appendChild(span2);

			const slots = <INodeList<IHTMLSlotElement>>(
				customElementWithNamedSlots.shadowRoot.querySelectorAll('slot')
			);

			expect(slots[0].assignedElements()).toEqual([div, span1]);
			expect(slots[1].assignedElements()).toEqual([span2]);
		});
	});
});
