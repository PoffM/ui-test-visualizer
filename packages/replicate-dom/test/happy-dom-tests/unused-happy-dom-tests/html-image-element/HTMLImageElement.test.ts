/*
  This file is derived from:
  https://github.com/capricorn86/happy-dom/blob/6cbcc10a1a227b36e38a7bc33203b2ae029cca95/packages/happy-dom/test/nodes/html-image-element/HTMLImageElement.test.ts ,
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
import HTMLImageElement from '../../../src/nodes/html-image-element/HTMLImageElement.js';
import { beforeEach, describe, it, expect } from 'vitest';

describe('HTMLImageElement', () => {
	let window: Window;
	let document: Document;

	beforeEach(() => {
		window = new Window();
		document = window.document;
	});

	describe('Object.prototype.toString', () => {
		it('Returns `[object HTMLImageElement]`', () => {
			const element = document.createElement('img');
			expect(Object.prototype.toString.call(element)).toBe('[object HTMLImageElement]');
		});
	});

	for (const property of ['alt', 'referrerPolicy', 'sizes', 'src', 'srcset', 'useMap']) {
		describe(`get ${property}()`, () => {
			it(`Returns the "${property}" attribute.`, () => {
				const element = document.createElement('img');
				element.setAttribute(property, 'test');
				expect(element[property]).toBe('test');
			});
		});

		describe(`set ${property}()`, () => {
			it(`Sets the attribute "${property}".`, () => {
				const element = document.createElement('img');
				element[property] = 'test';
				expect(element.getAttribute(property)).toBe('test');
			});
		});
	}

	for (const property of ['height', 'width']) {
		describe(`get ${property}()`, () => {
			it(`Returns the "${property}" attribute.`, () => {
				const element = document.createElement('img');
				element.setAttribute(property, '100');
				expect(element[property]).toBe(100);
			});
		});

		describe(`set ${property}()`, () => {
			it(`Sets the attribute "${property}".`, () => {
				const element = document.createElement('img');
				element[property] = 100;
				expect(element.getAttribute(property)).toBe('100');
			});
		});
	}

	for (const property of ['isMap']) {
		describe(`get ${property}()`, () => {
			it(`Returns "true" if the "${property}" attribute is defined.`, () => {
				const element = document.createElement('img');
				element.setAttribute(property, '');
				expect(element[property]).toBe(true);
			});
		});

		describe(`set ${property}()`, () => {
			it(`Sets the "${property}" attribute to an empty string if set to "true".`, () => {
				const element = document.createElement('img');
				element[property] = true;
				expect(element.getAttribute(property)).toBe('');
			});
		});
	}

	describe('get complete()', () => {
		it('Returns "false".', () => {
			const element = <HTMLImageElement>document.createElement('img');
			expect(element.complete).toBe(false);
		});
	});

	describe('get naturalHeight()', () => {
		it('Returns "0".', () => {
			const element = <HTMLImageElement>document.createElement('img');
			expect(element.naturalHeight).toBe(0);
		});
	});

	describe('get naturalWidth()', () => {
		it('Returns "0".', () => {
			const element = <HTMLImageElement>document.createElement('img');
			expect(element.naturalWidth).toBe(0);
		});
	});

	describe('get crossOrigin()', () => {
		it('Returns "null".', () => {
			const element = <HTMLImageElement>document.createElement('img');
			expect(element.crossOrigin).toBe(null);
		});
	});

	describe('get decoding()', () => {
		it('Returns "auto".', () => {
			const element = <HTMLImageElement>document.createElement('img');
			expect(element.decoding).toBe('auto');
		});
	});

	describe('get loading()', () => {
		it('Returns "auto".', () => {
			const element = <HTMLImageElement>document.createElement('img');
			expect(element.loading).toBe('auto');
		});
	});

	describe('get x()', () => {
		it('Returns "0".', () => {
			const element = <HTMLImageElement>document.createElement('img');
			expect(element.x).toBe(0);
		});
	});

	describe('get y()', () => {
		it('Returns "0".', () => {
			const element = <HTMLImageElement>document.createElement('img');
			expect(element.y).toBe(0);
		});
	});

	describe('decode()', () => {
		it('Executes a promise.', async () => {
			const element = <HTMLImageElement>document.createElement('img');
			await element.decode();
		});
	});
});
