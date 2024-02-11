/*
  This file is derived from:
  https://github.com/capricorn86/happy-dom/blob/6cbcc10a1a227b36e38a7bc33203b2ae029cca95/packages/happy-dom/test/nodes/html-dialog-element/HTMLDialogElement.test.ts ,
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

import Event from '../../../src/event/Event.js';
import IHTMLDialogElement from '../../../src/nodes/html-dialog-element/IHTMLDialogElement.js';
import Window from '../../../src/window/Window.js';
import IWindow from '../../../src/window/IWindow.js';
import IDocument from '../../../src/nodes/document/IDocument.js';
import { beforeEach, describe, it, expect } from 'vitest';

describe('HTMLDialogElement', () => {
	let window: IWindow;
	let document: IDocument;
	let element: IHTMLDialogElement;

	beforeEach(() => {
		window = new Window();
		document = window.document;
		element = <IHTMLDialogElement>document.createElement('dialog');
	});

	describe('Object.prototype.toString', () => {
		it('Returns `[object HTMLDialogElement]`', () => {
			expect(Object.prototype.toString.call(element)).toBe('[object HTMLDialogElement]');
		});
	});

	describe('set open()', () => {
		it('Should set the open state', () => {
			element.open = true;
			expect(element.open).toBe(true);
			element.open = false;
			expect(element.open).toBe(false);
		});
	});

	describe('get open()', () => {
		it('Should be closed by default', () => {
			expect(element.open).toBe(false);
		});

		it('Should be open when show has been called', () => {
			element.show();
			expect(element.open).toBe(true);
		});

		it('Should be open when showModal has been called', () => {
			element.showModal();
			expect(element.open).toBe(true);
		});
	});

	describe('get returnValue()', () => {
		it('Should be empty string by default', () => {
			expect(element.returnValue).toBe('');
		});

		it('Should be set when close has been called with a return value', () => {
			element.close('foo');
			expect(element.returnValue).toBe('foo');
		});
	});

	describe('set returnValue()', () => {
		it('Should be possible to set manually', () => {
			element.returnValue = 'foo';
			expect(element.returnValue).toBe('foo');
		});
	});

	describe('close()', () => {
		it('Should be possible to close an open dialog', () => {
			element.show();
			element.close();
			expect(element.open).toBe(false);
			expect(element.getAttribute('open')).toBe(null);
		});

		it('Should be possible to close an open modal dialog', () => {
			element.showModal();
			element.close();
			expect(element.open).toBe(false);
			expect(element.getAttribute('open')).toBe(null);
		});

		it('Should be possible to close the dialog with a return value', () => {
			element.show();
			element.close('foo');
			expect(element.returnValue).toBe('foo');
		});

		it('Should be possible to close the modal dialog with a return value', () => {
			element.showModal();
			element.close('foo');
			expect(element.returnValue).toBe('foo');
		});

		it('Should dispatch a close event', () => {
			let dispatched: Event | null = null;
			element.addEventListener('close', (event: Event) => (dispatched = event));
			element.show();
			element.close();
			expect((<Event>(<unknown>dispatched)).cancelable).toBe(false);
			expect((<Event>(<unknown>dispatched)).bubbles).toBe(false);
		});

		it('Should only dispatch a close event when dialog wasnt already closed', () => {
			let dispatched: Event | null = null;
			element.addEventListener('close', (event: Event) => (dispatched = event));
			element.close();
			expect(dispatched).toBe(null);
		});

		it('Should dispatch a close event when closing a modal', () => {
			let dispatched: Event | null = null;
			element.addEventListener('close', (event: Event) => (dispatched = event));
			element.showModal();
			element.close();
			expect((<Event>(<unknown>dispatched)).cancelable).toBe(false);
			expect((<Event>(<unknown>dispatched)).bubbles).toBe(false);
		});
	});

	describe('showModal()', () => {
		it('Should be possible to show a modal dialog', () => {
			element.showModal();
			expect(element.open).toBe(true);
			expect(element.getAttributeNS(null, 'open')).toBe('');
		});
	});

	describe('show()', () => {
		it('Should be possible to show a dialog', () => {
			element.show();
			expect(element.open).toBe(true);
			expect(element.getAttributeNS(null, 'open')).toBe('');
		});
	});
});
