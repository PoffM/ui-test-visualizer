/*
  This file is derived from:
  https://github.com/capricorn86/happy-dom/blob/6cbcc10a1a227b36e38a7bc33203b2ae029cca95/packages/happy-dom/test/nodes/html-input-element/HTMLInputElement.test.ts ,
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

import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { DOMException, File, Window } from 'happy-dom'
import type { Document, IHTMLInputElement, INodeList, Window } from 'happy-dom'
import { addTestElement, initTestReplicaDom } from '../../test-setup'
import { serializeDomNode } from '../../../src'

describe('hTMLInputElement', () => {
  let window: Window
  let document: Document

  let replicaWindow: Window
  let replicaDocument: Document

  beforeEach(() => {
    window = new Window()
    document = window.document

    replicaWindow = new Window()
    replicaDocument = replicaWindow.document

    initTestReplicaDom(window, replicaWindow)
  })

  afterEach(() => {
    expect(replicaDocument.body.outerHTML).toBe(document.body.outerHTML)

    const primarySerialized = serializeDomNode(document.body, window)
    const replicaSerialized = serializeDomNode(replicaDocument.body, replicaWindow)
    expect(replicaSerialized).toEqual(primarySerialized)
  })

  function testElement(type: string) {
    return addTestElement<IHTMLInputElement>(
      document,
      replicaDocument,
      type,
      'createElement',
    )
  }

  describe('object.prototype.toString', () => {
    it('returns `[object HTMLInputElement]`', () => {
      const { replica } = testElement('input')
      expect(Object.prototype.toString.call(replica)).toBe('[object HTMLInputElement]')
    })
  })

  describe('get value()', () => {
    for (const type of ['hidden', 'submit', 'image', 'reset', 'button']) {
      it(`returns the attribute "value" if type is "`, () => {
        const { primary, replica } = testElement('input')
        primary.type = type
        primary.setAttribute('value', 'VALUE')
        expect(replica.value).toBe('VALUE')
      })
    }

    for (const type of ['checkbox', 'radio']) {
      it(`returns the attribute "value" if type is " 2`, () => {
        const { primary, replica } = testElement('input')
        primary.type = type
        primary.setAttribute('value', 'VALUE')
        expect(replica.value).toBe('VALUE')
      })

      it(`returns "on" if the attribute "value" has not been set and type is "`, () => {
        const { primary, replica } = testElement('input')
        primary.type = type
        expect(replica.value).toBe('on')
      })
    }

    for (const type of ['text', 'search', 'url', 'tel', 'password']) {
      it(`returns the attribute "value" if type is " 3`, () => {
        const { primary, replica } = testElement('input')
        primary.type = type
        primary.setAttribute('value', 'VALUE')
        expect(replica.selectionStart).toBe(5)
        expect(replica.selectionEnd).toBe(5)
        expect(replica.value).toBe('VALUE')
      })
    }

    it('returns "/fake/path/[filename]" if type is "file".', () => {
      const { primary, replica } = testElement('input')
      const file = new File(['TEST'], 'filename.jpg')
      primary.type = 'file'
      primary.files.push(file)
      expect(replica.value).toBe('/fake/path/filename.jpg')
    })
  })

  describe('set value()', () => {
    for (const type of ['hidden', 'submit', 'image', 'reset', 'button', 'checkbox', 'radio']) {
      it(`sets the attribute "value" to the value if type is "`, () => {
        const { primary, replica } = testElement('input')
        primary.type = type
        primary.value = 'VALUE'
        expect(replica.getAttribute('value')).toBe('VALUE')
      })
    }

    it('throws an exception if a value other than empty string is provided and type is "file".', () => {
      const { primary, replica } = testElement('input')
      primary.type = 'file'
      expect(() => {
        replica.value = 'TEST'
      }).toThrow(
        'Input elements of type "file" may only programmatically set the value to empty string.',
      )
    })

    it('accepts an empty string if type is "file".', () => {
      const { primary, replica } = testElement('input')
      primary.type = 'file'
      primary.value = ''
      expect(replica.value).toBe('')
    })

    it('trims the value if type is "email".', () => {
      const { primary, replica } = testElement('input')
      primary.type = 'email'
      primary.value = '  \n\rtest@test.com  '
      expect(replica.value).toBe('test@test.com')
    })

    it('trims each email address in the value if type is "email" and "multiple" is set to "true".', () => {
      const { primary, replica } = testElement('input')
      primary.type = 'email'
      primary.setAttribute('multiple', 'multiple')
      primary.value = '  \n\rtest@test.com , test2@test.com  '

      expect(replica.value).toBe('test@test.com,test2@test.com')
    })

    for (const type of ['password', 'search', 'tel', 'text']) {
      it(`removes new lines if type is "`, () => {
        const { primary, replica } = testElement('input')
        primary.type = type
        primary.value = '\n\rVALUE\n\r'
        expect(replica.value).toBe('VALUE')
        expect(replica.selectionStart).toBe(5)
        expect(replica.selectionEnd).toBe(5)
      })

      it(`sets selection range.`, () => {
        const { primary, replica } = testElement('input')
        primary.type = type
        primary.selectionDirection = 'forward'
        primary.value = 'VALUE'
        expect(replica.selectionStart).toBe(5)
        expect(replica.selectionEnd).toBe(5)
        expect(replica.selectionDirection).toBe('none')
      })
    }

    it('sets the value if the value is a valid hex code and type is "color".', () => {
      const { primary, replica } = testElement('input')
      primary.type = 'color'
      primary.value = '#333333'
      expect(replica.value).toBe('#333333')
    })

    it('sets the value to "#000000" if the value is not a valid hex code and type is "color".', () => {
      const { primary, replica } = testElement('input')
      primary.type = 'color'
      primary.value = 'test'
      expect(replica.value).toBe('#000000')
      primary.value = '#111'
      expect(replica.value).toBe('#000000')
    })

    it('sets the value if it is a valid number and type is "number".', () => {
      const { primary, replica } = testElement('input')
      primary.type = 'number'
      primary.value = '10'
      expect(replica.value).toBe('10')
    })

    it('sets the value to empty string if the value is not a valid number and type is "number".', () => {
      const { primary, replica } = testElement('input')
      primary.type = 'number'
      primary.value = 'test'
      expect(replica.value).toBe('')
    })

    it('sets the value to "50" if no min or max has been set, the value is an invalid number and the type is "range".', () => {
      const { primary, replica } = testElement('input')
      primary.type = 'range'
      primary.value = 'test'
      expect(replica.value).toBe('50')
    })

    it('sets the value to "25" if max has been set to "50", the value is an invalid number and the type is "range".', () => {
      const { primary, replica } = testElement('input')
      primary.type = 'range'
      primary.max = '50'
      primary.value = 'test'
      expect(replica.value).toBe('25')
    })

    it('sets the value to "40" if min is set to "20" and max is set to "60", the value is an invalid number and the type is "range".', () => {
      const { primary, replica } = testElement('input')
      primary.type = 'range'
      primary.min = '20'
      primary.max = '60'
      primary.value = 'test'
      expect(replica.value).toBe('40')
    })

    it('sets the value to "40" if min is set to "40", the value is out of range and the type is "range".', () => {
      const { primary, replica } = testElement('input')
      primary.type = 'range'
      primary.min = '40'
      primary.max = '80'
      primary.value = '20'
      expect(replica.value).toBe('40')
    })

    it('sets the value to "80" if max is set to "80", the value is out of range and the type is "range".', () => {
      const { primary, replica } = testElement('input')
      primary.type = 'range'
      primary.min = '40'
      primary.max = '80'
      primary.value = '100'
      expect(replica.value).toBe('80')
    })

    it('sets the value if it is valid, within range and type is "range".', () => {
      const { primary, replica } = testElement('input')
      primary.type = 'range'
      primary.min = '40'
      primary.max = '80'
      primary.value = '60'
      expect(replica.value).toBe('60')
    })

    it('trims and removes new lines if type is "url".', () => {
      const { primary, replica } = testElement('input')
      primary.type = 'url'
      primary.value = '  \n\rhttp://www.test.com\n\r '
      expect(replica.value).toBe('http://www.test.com')
    })
  })

  describe('get valueAsNumber()', () => {
    describe('should return NaN for non-numeric input type', () => {
      for (const type of [
        'button',
        'checkbox',
        'color',
        'email',
        'file',
        'hidden',
        'image',
        'password',
        'radio',
        'reset',
        'search',
        'submit',
        'tel',
        'text',
        'url',
      ]) {
        it(`"${type}"`, () => {
          const { primary, replica } = testElement('input')
          primary.setAttribute('type', type)
          if (type === 'file') {
            primary.value = ''
          }
          else {
            primary.value = '0'
          }
          expect(replica.valueAsNumber).toBeNaN()
        })
      }
    })
    describe('with default value', () => {
      for (const type of ['date', 'datetime-local', 'month', 'number', 'time', 'week']) {
        it(`should return NaN for type `, () => {
          const { primary, replica } = testElement('input')
          primary.type = type
          primary.value = ''
          expect(replica.valueAsNumber).toBeNaN()
        })
      }
      it(`should return middle range value for type "range".`, () => {
        const { primary, replica } = testElement('input')
        primary.type = 'range'
        primary.value = ''
        const min = primary.min ? Number.parseFloat(primary.min) : 0
        const max = primary.max ? Number.parseFloat(primary.max) : 100
        expect(replica.valueAsNumber).toBe((max - min) / 2)
      })
    })

    describe('with valid value', () => {
      const testData: { type: string, value: string, want: number }[] = [
        { type: 'number', value: '123', want: 123 },
        { type: 'number', value: '1.23', want: 1.23 },
        { type: 'range', value: '75', want: 75 },
        { type: 'range', value: '12.5', want: 12.5 },
        { type: 'date', value: '2019-01-01', want: new Date('2019-01-01').getTime() },
        {
          type: 'datetime-local',
          value: '2019-01-01T00:00',
          want:
						new Date('2019-01-01T00:00').getTime()
						  - new Date('2019-01-01T00:00').getTimezoneOffset() * 60000,
        },
        { type: 'month', value: '2019-01', want: 588 },
        { type: 'time', value: '00:00', want: 0 },
        { type: 'time', value: '12:00', want: 43200000 },
        { type: 'time', value: '18:55', want: 68100000 },
        { type: 'week', value: '2023-W22', want: 1685318400000 },
      ]
      it.each(testData)(`should return valid number for type $type`, ({ type, value, want }) => {
        const { primary, replica } = testElement('input')
        primary.type = type
        primary.value = value
        expect(replica.valueAsNumber).toEqual(want)
      })
    })
  })
  describe('set valueAsNumber()', () => {
    describe('with invalid value for', () => {
      it.each(['number', 'date', 'datetime-local', 'month', 'time', 'week'])(
        'type "%s" should set default empty value.',
        (type) => {
          const { primary, replica } = testElement('input')
          primary.type = type
          expect(() => {
            // @ts-expect-error aaa
            primary.valueAsNumber = 'x'
          }).not.toThrow()
          expect(replica.value).toBe('')
        },
      )
      it(`type "range" should set default middle range value.`, () => {
        const { primary, replica } = testElement('input')
        primary.type = 'range'
        expect(() => {
          // @ts-expect-error aaa
          primary.valueAsNumber = 'x'
        }).not.toThrow()
        expect(replica.value).toBe('50')
      })
    })

    describe('with valid value for', () => {
      const testCases = [
        { type: 'number', value: 123, want: '123' },
        { type: 'number', value: 1.23, want: '1.23' },
        { type: 'range', value: 75, want: '75' },
        { type: 'range', value: 12.5, want: '12.5' },
        { type: 'date', value: new Date('2019-01-01').getTime(), want: '2019-01-01' },
        { type: 'datetime-local', value: 1546300800000, want: '2019-01-01T00:00' },
        { type: 'month', value: 588, want: '2019-01' },
        { type: 'time', value: 0, want: '00:00' },
        { type: 'time', value: 43200000, want: '12:00' },
        { type: 'time', value: 68100000, want: '18:55' },
        { type: 'time', value: 83709010, want: '23:15:09.01' },
        { type: 'week', value: 1685318400000, want: '2023-W22' },
        { type: 'week', value: 1672531200000, want: '2022-W52' },
      ]
      it.each(testCases)(
				`type "$type" should set a corresponding value`,
				({ type, value, want }) => {
				  const { primary, replica } = testElement('input')
				  primary.type = type
				  primary.valueAsNumber = value
				  expect(replica.value).toEqual(want)
				},
      )
    })
  })

  it('deleteme', () => {
    const { primary, replica } = testElement('input')
    primary.type = 'week'
    primary.valueAsNumber = 1685318400000
    expect(replica.value).toEqual('2023-W22')
  })

  describe('get valueAsDate()', () => {
    it.each([
      'button',
      'checkbox',
      'color',
      'date',
      'datetime-local',
      'email',
      'file',
      'hidden',
      'image',
      'month',
      'number',
      'password',
      'radio',
      'range',
      'reset',
      'search',
      'submit',
      'tel',
      'text',
      'time',
      'url',
      'week',
    ])(`should return null for type '%s' with default value`, (type) => {
      const { primary, replica } = testElement('input')
      primary.type = type
      primary.value = ''
      expect(replica.valueAsDate).toBeNull()
    })
    it.each(<{ type: string, value: string, want: Date | null }[]>[
      { type: 'date', value: '2019-01-01', want: new Date('2019-01-01T00:00Z') },
      { type: 'month', value: '2019-01', want: new Date('2019-01-01') },
      { type: 'time', value: '00:00', want: new Date('1970-01-01T00:00Z') },
      { type: 'time', value: '12:00', want: new Date('1970-01-01T12:00Z') },
      { type: 'time', value: '18:55', want: new Date('1970-01-01T18:55Z') },
      { type: 'week', value: '1981-W01', want: new Date('1980-12-29T00:00Z') },
      { type: 'week', value: '2023-W22', want: new Date('2023-05-29T00:00Z') },
    ])(`should return valid date for type $type with valid value`, ({ type, value, want }) => {
      const { primary, replica } = testElement('input')
      primary.type = type
      primary.value = value
      expect(replica.valueAsDate).toEqual(want)
    })
  })

  describe('set valueAsDate()', () => {
    const dateInputs = ['date', 'month', 'time', 'week']
    it.each(dateInputs)('should accept Date object for type "%s"', (type) => {
      const { primary, replica } = testElement('input')
      primary.type = type
      expect(() => {
        replica.valueAsDate = new Date()
      }).not.toThrow()
    })
    it.each(dateInputs)('should accept null for type "%s"', (type) => {
      const { primary, replica } = testElement('input')
      primary.type = type
      expect(() => {
        primary.valueAsDate = null
      }).not.toThrow()
      expect(replica.value).toBe('')
    })
    it.each([
      { type: 'date', value: new Date('2019-01-01T00:00+01:00'), want: '2018-12-31' },
      { type: 'month', value: new Date('2019-01-01T00:00+01:00'), want: '2018-12' },
      { type: 'time', value: new Date('2019-01-01T00:00+01:00'), want: '23:00' },
      { type: 'week', value: new Date('1982-01-03T00:00Z'), want: '1981-W53' },
    ])(`should set UTC value for type $type with valid date object`, ({ type, value, want }) => {
      const { primary, replica } = testElement('input')
      primary.type = type
      primary.valueAsDate = value
      expect(replica.value).toEqual(want)
    })
  })

  describe('get selectionStart()', () => {
    it('returns the length of the attribute "value" if value has not been set using the property.', () => {
      const { primary, replica } = testElement('input')
      primary.setAttribute('value', 'TEST_VALUE')
      expect(replica.selectionStart).toBe(10)
    })

    it('returns the length of the value set using the property.', () => {
      const { primary, replica } = testElement('input')
      primary.setAttribute('value', 'TEST_VALUE')
      primary.selectionStart = 5
      expect(replica.selectionStart).toBe(5)
    })
  })

  describe('set selectionStart()', () => {
    it('sets the value to the length of the property "value" if it is out of range.', () => {
      const { primary, replica } = testElement('input')
      primary.setAttribute('value', 'TEST_VALUE')
      primary.selectionStart = 20
      expect(replica.selectionStart).toBe(10)
    })

    it('sets the property.', () => {
      const { primary, replica } = testElement('input')
      primary.value = 'TEST_VALUE'
      primary.selectionStart = 5
      expect(replica.selectionStart).toBe(5)
    })
  })

  describe('get selectionEnd()', () => {
    it('returns the length of the attribute "value" if value has not been set using the property.', () => {
      const { primary, replica } = testElement('input')
      primary.setAttribute('value', 'TEST_VALUE')
      expect(replica.selectionEnd).toBe(10)
    })

    it('returns the length of the value set using the property.', () => {
      const { primary, replica } = testElement('input')
      primary.setAttribute('value', 'TEST_VALUE')
      primary.selectionEnd = 5
      expect(replica.selectionEnd).toBe(5)
    })
  })

  describe('set selectionEnd()', () => {
    it('sets the value to the length of the property "value" if it is out of range.', () => {
      const { primary, replica } = testElement('input')
      primary.setAttribute('value', 'TEST_VALUE')
      primary.selectionEnd = 20
      expect(replica.selectionEnd).toBe(10)
    })

    it('sets the property.', () => {
      const { primary, replica } = testElement('input')
      primary.value = 'TEST_VALUE'
      primary.selectionEnd = 5
      expect(replica.selectionEnd).toBe(5)
    })
  })

  for (const property of [
    'disabled',
    'autofocus',
    'required',
    'indeterminate',
    'multiple',
    'readOnly',
  ]) {
    describe(`get ${property}()`, () => {
      it('returns attribute value.', () => {
        const { primary, replica } = testElement('input')
        // @ts-expect-error property should exist
        expect(replica[property]).toBe(false)
        primary.setAttribute(property, '')
        // @ts-expect-error property should exist
        expect(replica[property]).toBe(true)
      })
    })

    describe(`set ${property}()`, () => {
      it('sets attribute value.', () => {
        const { primary, replica } = testElement('input')
        // @ts-expect-error property should exist
        primary[property] = true
        expect(replica.getAttribute(property)).toBe('')
      })
    })
  }

  for (const property of [
    'name',
    'alt',
    'src',
    'accept',
    'allowdirs',
    'autocomplete',
    'min',
    'max',
    'pattern',
    'placeholder',
    'step',
    'inputmode',
  ]) {
    describe(`get ${property}()`, () => {
      it('returns attribute value.', () => {
        const { primary, replica } = testElement('input')
        // @ts-expect-error property should exist
        expect(replica[property]).toBe('')
        primary.setAttribute(property, 'value')
        // @ts-expect-error property should exist
        expect(replica[property]).toBe('value')
      })
    })

    describe(`set ${property}()`, () => {
      it('sets attribute value.', () => {
        const { primary, replica } = testElement('input')
        // @ts-expect-error property should exist
        primary[property] = 'value'
        expect(replica.getAttribute(property)).toBe('value')
      })
    })
  }

  for (const property of ['height', 'width']) {
    describe(`get ${property}()`, () => {
      it('returns attribute value.', () => {
        const { primary, replica } = testElement('input')
        // @ts-expect-error property should exist
        expect(replica[property]).toBe(0)
        // @ts-expect-error property should exist
        primary[property] = 20
        // @ts-expect-error property should exist
        expect(replica[property]).toBe(20)
      })
    })

    describe(`set ${property}()`, () => {
      it('sets attribute value.', () => {
        const { primary, replica } = testElement('input')
        primary.setAttribute(property, '50')
        // @ts-expect-error property should exist
        expect(replica[property]).toBe(0)
        // @ts-expect-error property should exist
        primary[property] = 50
        // @ts-expect-error property should exist
        expect(replica[property]).toBe(50)
        expect(replica.getAttribute(property)).toBe('50')
      })
    })
  }

  for (const property of ['minLength', 'maxLength']) {
    describe(`get ${property}()`, () => {
      it('returns attribute value.', () => {
        const { primary, replica } = testElement('input')
        // @ts-expect-error property should exist
        expect(replica[property]).toBe(-1)
        primary.setAttribute(property, '50')
        // @ts-expect-error property should exist
        expect(replica[property]).toBe(50)
      })
    })

    describe(`set ${property}()`, () => {
      it('sets attribute value.', () => {
        const { primary, replica } = testElement('input')
        // @ts-expect-error property should exist
        primary[property] = 50
        // @ts-expect-error property should exist
        expect(replica[property]).toBe(50)
        expect(replica.getAttribute(property)).toBe('50')
      })
    })
  }

  describe('get checked()', () => {
    it('returns attribute value if not set.', () => {
      const { primary, replica } = testElement('input')
      primary.setAttribute('checked', '')
      expect(replica.checked).toBe(true)
    })

    it('returns checked state overriding the attribute when set', () => {
      const { primary, replica } = testElement('input')
      primary.setAttribute('checked', '')
      primary.checked = false
      expect(replica.checked).toBe(false)
    })
  })

  describe('set checked()', () => {
    it('sets the checked state.', () => {
      const { primary, replica } = testElement('input')
      primary.setAttribute('checked', '')
      primary.checked = true
      primary.removeAttribute('checked')

      expect(replica.checked).toBe(true)
    })

    it('unchecks other radio buttons with the same name in a form.', () => {
      const { primary, replica } = testElement('input')
      const form = primary.appendChild(document.createElement('form'))
      const radio1 = <IHTMLInputElement>document.createElement('input')
      const radio2 = <IHTMLInputElement>document.createElement('input')
      const radio3 = <IHTMLInputElement>document.createElement('input')

      radio1.type = 'radio'
      radio2.type = 'radio'
      radio3.type = 'radio'

      radio1.name = 'radio'
      radio2.name = 'radio'
      radio3.name = 'radio'

      form.appendChild(radio1)
      form.appendChild(radio2)
      form.appendChild(radio3)

      radio1.checked = true

      const replicaForm = replica.querySelector('form')!
      const repliceRadios = replicaForm.querySelectorAll('input') as INodeList<IHTMLInputElement>

      expect(repliceRadios[0]!.checked).toBe(true)
      expect(repliceRadios[1]!.checked).toBe(false)
      expect(repliceRadios[2]!.checked).toBe(false)

      radio2.checked = true

      expect(repliceRadios[0]!.checked).toBe(false)
      expect(repliceRadios[1]!.checked).toBe(true)
      expect(repliceRadios[2]!.checked).toBe(false)
    })

    it('unchecks other radio buttons with the same name outside of a form', () => {
      const radio1 = <IHTMLInputElement>document.appendChild(document.createElement('input'))
      const radio2 = <IHTMLInputElement>document.appendChild(document.createElement('input'))
      const radio3 = <IHTMLInputElement>document.appendChild(document.createElement('input'))

      radio1.type = 'radio'
      radio2.type = 'radio'
      radio3.type = 'radio'

      radio1.name = 'radio'
      radio2.name = 'radio'
      radio3.name = 'radio'

      document.body.appendChild(radio1)
      document.body.appendChild(radio2)
      document.body.appendChild(radio3)

      radio1.checked = true

      const repliceRadios = replicaDocument.querySelectorAll('input') as INodeList<IHTMLInputElement>

      expect(repliceRadios[0]!.checked).toBe(true)
      expect(repliceRadios[1]!.checked).toBe(false)
      expect(repliceRadios[2]!.checked).toBe(false)

      radio2.checked = true

      expect(repliceRadios[0]!.checked).toBe(false)
      expect(repliceRadios[1]!.checked).toBe(true)
      expect(repliceRadios[2]!.checked).toBe(false)
    })
  })

  describe('get type()', () => {
    it('returns attribute value.', () => {
      const { primary, replica } = testElement('input')
      expect(replica.type).toBe('text')
      primary.setAttribute('type', 'date')
      expect(replica.type).toBe('date')
    })
  })

  describe('set type()', () => {
    it('sets attribute value.', () => {
      const { primary, replica } = testElement('input')
      primary.type = 'date'
      expect(replica.getAttribute('type')).toBe('date')
    })
  })

  describe('get size()', () => {
    it('returns attribute value.', () => {
      const { primary, replica } = testElement('input')
      expect(replica.size).toBe(20)
      primary.size = 50
      expect(replica.size).toBe(50)
    })
  })

  describe('set size()', () => {
    it('sets attribute value.', () => {
      const { primary, replica } = testElement('input')
      primary.setAttribute('size', '50')
      expect(replica.size).toBe(50)
      primary.size = 60
      expect(replica.size).toBe(60)
      expect(replica.getAttribute('size')).toBe('60')
    })
  })

  describe('get formNoValidate()', () => {
    it('returns "true" if defined.', () => {
      const { primary, replica } = testElement('input')
      expect(replica.formNoValidate).toBe(false)
      primary.setAttribute('formnovalidate', '')
      expect(replica.formNoValidate).toBe(true)
    })
  })

  describe('set formNoValidate()', () => {
    it('sets attribute value.', () => {
      const { primary, replica } = testElement('input')
      primary.formNoValidate = true
      expect(replica.getAttribute('formnovalidate')).toBe('')
    })
  })

  describe('get validationMessage()', () => {
    it('returns validation message.', () => {
      const { primary, replica } = testElement('input')
      primary.setCustomValidity('Error message')
      expect(replica.validationMessage).toBe('Error message')
    })
  })

  describe(`get labels()`, () => {
    it('returns associated labels', () => {
      const element = document.createElement('input')
      const label1 = document.createElement('label')
      const label2 = document.createElement('label')
      const parentLabel = document.createElement('label')

      label1.setAttribute('for', 'select1')
      label2.setAttribute('for', 'select1')

      element.id = 'select1'

      parentLabel.appendChild(element)
      document.body.appendChild(label1)
      document.body.appendChild(label2)
      document.body.appendChild(parentLabel)

      const replica = replicaDocument.querySelector('input') as IHTMLInputElement

      const labels = replica.labels

      expect(labels.length).toBe(3)
      expect(labels[0]?.getAttribute('for')).toBe('select1')
      expect(labels[1]?.getAttribute('for')).toBe('select1')
      expect(labels[2] === replicaDocument.body.childNodes[2]).toBe(true)
    })

    it('returns associated labels for elements with no ID', () => {
      const element = document.createElement('input')
      const parentLabel = document.createElement('label')

      element.id = ''

      parentLabel.appendChild(element)
      document.body.appendChild(parentLabel)

      const replica = replicaDocument.querySelector('input') as IHTMLInputElement

      const labels = replica.labels

      expect(labels.length).toBe(1)
      expect(labels[0] === replicaDocument.body.childNodes[0]).toBe(true)
    })
  })

  describe('setCustomValidity()', () => {
    it('returns validation message.', () => {
      const { primary, replica } = testElement('input')
      primary.setCustomValidity('Error message')
      expect(replica.validationMessage).toBe('Error message')
      primary.setCustomValidity(<string>(<unknown>null))
      expect(replica.validationMessage).toBe('null')
      primary.setCustomValidity('')
      expect(replica.validationMessage).toBe('')
    })
  })

  describe('select()', () => {
    it('selects all text.', () => {
      const { primary, replica } = testElement('input')
      primary.value = 'TEST_VALUE'
      primary.select()
      expect(replica.selectionStart).toBe(0)
      expect(replica.selectionEnd).toBe(10)
      expect(replica.selectionDirection).toBe('none')
    })
  })

  describe('setSelectionRange()', () => {
    it('sets selection range.', () => {
      const { primary, replica } = testElement('input')
      primary.value = 'TEST_VALUE'
      primary.setSelectionRange(1, 5, 'forward')
      expect(replica.selectionStart).toBe(1)
      expect(replica.selectionEnd).toBe(5)
      expect(replica.selectionDirection).toBe('forward')
    })

    it('sets selection end to the value length if out of range.', () => {
      const { primary, replica } = testElement('input')
      primary.value = 'TEST_VALUE'
      primary.setSelectionRange(1, 100, 'backward')
      expect(replica.selectionStart).toBe(1)
      expect(replica.selectionEnd).toBe(10)
      expect(replica.selectionDirection).toBe('backward')
    })
  })

  describe('setRangeText()', () => {
    it('sets a range text with selection mode set to "preserve".', () => {
      const { primary, replica } = testElement('input')
      primary.value = 'TEST_VALUE'
      primary.setRangeText('_NEW_', 4, 5)
      expect(replica.selectionStart).toBe(14)
      expect(replica.selectionEnd).toBe(14)
      expect(replica.value).toBe('TEST_NEW_VALUE')
    })

    it('sets a range text with selection mode set to "select".', () => {
      const { primary, replica } = testElement('input')
      primary.value = 'TEST_VALUE'
      // @ts-expect-error use string as enum
      primary.setRangeText('_NEW_', 4, 5, 'select')
      expect(replica.selectionStart).toBe(4)
      expect(replica.selectionEnd).toBe(14)
      expect(replica.value).toBe('TEST_NEW_VALUE')
    })

    it('sets a range text with selection mode set to "start".', () => {
      const { primary, replica } = testElement('input')
      primary.value = 'TEST_VALUE'
      // @ts-expect-error use string as enum
      primary.setRangeText('_NEW_', 4, 5, 'start')
      expect(replica.selectionStart).toBe(4)
      expect(replica.selectionEnd).toBe(4)
      expect(replica.value).toBe('TEST_NEW_VALUE')
    })

    it('sets a range text with selection mode set to "end".', () => {
      const { primary, replica } = testElement('input')
      primary.value = 'TEST_VALUE'
      // @ts-expect-error use string as enum
      primary.setRangeText('_NEW_', 4, 5, 'end')
      expect(replica.selectionStart).toBe(14)
      expect(replica.selectionEnd).toBe(14)
      expect(replica.value).toBe('TEST_NEW_VALUE')
    })
  })

  for (const method of ['checkValidity', 'reportValidity']) {
    describe(`${method}()`, () => {
      it('returns "true" if the field is "disabled".', () => {
        const { primary, replica } = testElement('input')
        primary.required = true
        primary.disabled = true
        // @ts-expect-error property should exist
        expect(replica[method]()).toBe(true)
      })

      it('returns "true" if the field is "readOnly".', () => {
        const { primary, replica } = testElement('input')
        primary.required = true
        primary.readOnly = true
        // @ts-expect-error property should exist
        expect(replica[method]()).toBe(true)
      })

      it('returns "true" if the field type is "hidden".', () => {
        const { primary, replica } = testElement('input')
        primary.required = true
        primary.type = 'hidden'
        // @ts-expect-error property should exist
        expect(replica[method]()).toBe(true)
      })

      it('returns "true" if the field type is "reset".', () => {
        const { primary, replica } = testElement('input')
        primary.required = true
        primary.type = 'reset'
        // @ts-expect-error property should exist
        expect(replica[method]()).toBe(true)
      })

      it('returns "true" if the field type is "button".', () => {
        const { primary, replica } = testElement('input')
        primary.required = true
        primary.type = 'button'
        // @ts-expect-error property should exist
        expect(replica[method]()).toBe(true)
      })

      it('returns "false" if invalid.', () => {
        const { primary, replica } = testElement('input')
        primary.required = true
        // @ts-expect-error property should exist
        expect(replica[method]()).toBe(false)
      })
    })
  }

  describe('stepUp()', () => {
    it('steps up with default value.', () => {
      const { primary, replica } = testElement('input')
      primary.type = 'number'
      primary.stepUp()
      expect(replica.value).toBe('1')
    })

    it('steps up with defined increment value.', () => {
      const { primary, replica } = testElement('input')
      primary.type = 'number'
      primary.value = '1'
      primary.stepUp(3)
      expect(replica.value).toBe('4')
    })
  })

  describe('stepDown()', () => {
    it('steps up with default value.', () => {
      const { primary, replica } = testElement('input')
      primary.type = 'number'
      primary.stepDown()
      expect(replica.value).toBe('-1')
    })

    it('steps up with defined increment value.', () => {
      const { primary, replica } = testElement('input')
      primary.type = 'number'
      primary.value = '1'
      primary.stepDown(3)
      expect(replica.value).toBe('-2')
    })

    it('throws exception when invalid type.', () => {
      const { replica } = testElement('input')
      expect(() => replica.stepDown()).toThrowError(
        new DOMException('This form element is not steppable.'),
      )
    })
  })
})
