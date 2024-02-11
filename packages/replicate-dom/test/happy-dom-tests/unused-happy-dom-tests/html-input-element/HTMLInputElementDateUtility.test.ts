/*
  This file is derived from:
  https://github.com/capricorn86/happy-dom/blob/6cbcc10a1a227b36e38a7bc33203b2ae029cca95/packages/happy-dom/test/nodes/html-input-element/HTMLInputElementDateUtility.test.ts ,
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

import { describe, it, expect } from 'vitest';
import HTMLInputElementDateUtility from '../../../src/nodes/html-input-element/HTMLInputElementDateUtility.js';

describe('HTMLInputElementDateUtility', () => {
	describe('dateIsoWeek()', () => {
		it('Returns the ISO week number', () => {
			expect(HTMLInputElementDateUtility.dateIsoWeek(new Date('2021-01-01'))).toBe('2020-W53');
			expect(HTMLInputElementDateUtility.dateIsoWeek(new Date('2021-01-03'))).toBe('2020-W53');
			expect(HTMLInputElementDateUtility.dateIsoWeek(new Date('2021-01-04'))).toBe('2021-W01');
			expect(HTMLInputElementDateUtility.dateIsoWeek(new Date('2021-01-10'))).toBe('2021-W01');
			expect(HTMLInputElementDateUtility.dateIsoWeek(new Date('2015-10-19'))).toBe('2015-W43');
			expect(HTMLInputElementDateUtility.dateIsoWeek(new Date('2023-01-01'))).toBe('2022-W52');
			expect(HTMLInputElementDateUtility.dateIsoWeek(new Date('2023-01-02'))).toBe('2023-W01');
			expect(HTMLInputElementDateUtility.dateIsoWeek(new Date('2024-01-01'))).toBe('2024-W01');
			expect(HTMLInputElementDateUtility.dateIsoWeek(new Date('2025-01-01'))).toBe('2025-W01');
			expect(HTMLInputElementDateUtility.dateIsoWeek(new Date('1977-01-01'))).toBe('1976-W53');
			expect(HTMLInputElementDateUtility.dateIsoWeek(new Date('1977-01-02'))).toBe('1976-W53');
			expect(HTMLInputElementDateUtility.dateIsoWeek(new Date('1977-12-31'))).toBe('1977-W52');
			expect(HTMLInputElementDateUtility.dateIsoWeek(new Date('1978-01-01'))).toBe('1977-W52');
			expect(HTMLInputElementDateUtility.dateIsoWeek(new Date('1978-01-02'))).toBe('1978-W01');
			expect(HTMLInputElementDateUtility.dateIsoWeek(new Date('1978-12-31'))).toBe('1978-W52');
			expect(HTMLInputElementDateUtility.dateIsoWeek(new Date('1979-01-01'))).toBe('1979-W01');
			expect(HTMLInputElementDateUtility.dateIsoWeek(new Date('1979-12-30'))).toBe('1979-W52');
			expect(HTMLInputElementDateUtility.dateIsoWeek(new Date('1979-12-31'))).toBe('1980-W01');
			expect(HTMLInputElementDateUtility.dateIsoWeek(new Date('1980-01-01'))).toBe('1980-W01');
			expect(HTMLInputElementDateUtility.dateIsoWeek(new Date('1980-12-28'))).toBe('1980-W52');
			expect(HTMLInputElementDateUtility.dateIsoWeek(new Date('1980-12-29'))).toBe('1981-W01');
			expect(HTMLInputElementDateUtility.dateIsoWeek(new Date('1980-12-30'))).toBe('1981-W01');
			expect(HTMLInputElementDateUtility.dateIsoWeek(new Date('1980-12-31'))).toBe('1981-W01');
			expect(HTMLInputElementDateUtility.dateIsoWeek(new Date('1981-01-01'))).toBe('1981-W01');
			expect(HTMLInputElementDateUtility.dateIsoWeek(new Date('1981-12-31'))).toBe('1981-W53');
			expect(HTMLInputElementDateUtility.dateIsoWeek(new Date('1982-01-01'))).toBe('1981-W53');
			expect(HTMLInputElementDateUtility.dateIsoWeek(new Date('1982-01-03'))).toBe('1981-W53');
			expect(HTMLInputElementDateUtility.dateIsoWeek(new Date('1982-01-04'))).toBe('1982-W01');
		});
	});

	describe('isoWeekDate()', () => {
		it('Returns the ISO week number', () => {
			expect(HTMLInputElementDateUtility.isoWeekDate('2020-W53')).toEqual(
				new Date('2020-12-28T00:00Z')
			);
			expect(HTMLInputElementDateUtility.isoWeekDate('2021-W53')).toEqual(new Date('x'));
			expect(HTMLInputElementDateUtility.isoWeekDate('2021-W01')).toEqual(
				new Date('2021-01-04T00:00Z')
			);
			expect(HTMLInputElementDateUtility.isoWeekDate('2015-W43')).toEqual(
				new Date('2015-10-19T00:00Z')
			);
			expect(HTMLInputElementDateUtility.isoWeekDate('2023-W01')).toEqual(
				new Date('2023-01-02T00:00Z')
			);
			expect(HTMLInputElementDateUtility.isoWeekDate('2023-W52')).toEqual(
				new Date('2023-12-25T00:00Z')
			);
			expect(HTMLInputElementDateUtility.isoWeekDate('2024-W01')).toEqual(
				new Date('2024-01-01T00:00Z')
			);
			expect(HTMLInputElementDateUtility.isoWeekDate('2025-W01')).toEqual(
				new Date('2024-12-30T00:00Z')
			);
			expect(HTMLInputElementDateUtility.isoWeekDate('1976-W53')).toEqual(
				new Date('1976-12-27T00:00Z')
			);
			expect(HTMLInputElementDateUtility.isoWeekDate('1977-W53')).toEqual(new Date('x'));
			expect(HTMLInputElementDateUtility.isoWeekDate('1977-W52')).toEqual(
				new Date('1977-12-26T00:00Z')
			);
			expect(HTMLInputElementDateUtility.isoWeekDate('1978-W52')).toEqual(
				new Date('1978-12-25T00:00Z')
			);
			expect(HTMLInputElementDateUtility.isoWeekDate('1978-W01')).toEqual(
				new Date('1978-01-02T00:00Z')
			);
			expect(HTMLInputElementDateUtility.isoWeekDate('1979-W01')).toEqual(
				new Date('1979-01-01T00:00Z')
			);
			expect(HTMLInputElementDateUtility.isoWeekDate('1979-W52')).toEqual(
				new Date('1979-12-24T00:00Z')
			);
			expect(HTMLInputElementDateUtility.isoWeekDate('1980-W01')).toEqual(
				new Date('1979-12-31T00:00Z')
			);
			expect(HTMLInputElementDateUtility.isoWeekDate('1980-W52')).toEqual(
				new Date('1980-12-22T00:00Z')
			);
			expect(HTMLInputElementDateUtility.isoWeekDate('1981-W01')).toEqual(
				new Date('1980-12-29T00:00Z')
			);
			expect(HTMLInputElementDateUtility.isoWeekDate('1981-W53')).toEqual(
				new Date('1981-12-28T00:00Z')
			);
			expect(HTMLInputElementDateUtility.isoWeekDate('1982-W01')).toEqual(
				new Date('1982-01-04T00:00Z')
			);
			expect(HTMLInputElementDateUtility.isoWeekDate('1982-W53')).toEqual(new Date('x'));
		});
	});
});
