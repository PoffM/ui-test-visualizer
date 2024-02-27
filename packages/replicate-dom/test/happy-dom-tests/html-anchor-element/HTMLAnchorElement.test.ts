/*
  This file is derived from:
  https://github.com/capricorn86/happy-dom/blob/6cbcc10a1a227b36e38a7bc33203b2ae029cca95/packages/happy-dom/test/nodes/html-anchor-element/HTMLAnchorElement.test.ts ,
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
import { Window } from 'happy-dom'
import type { IDocument, IHTMLAnchorElement, IWindow } from 'happy-dom'
import { addTestElement, initTestReplicaDom } from '../../test-setup'
import { serializeDomNode } from '../../../src'

const BLOB_URL = 'blob:https://mozilla.org'

describe('hTMLAnchorElement', () => {
  let window: IWindow
  let document: IDocument

  let replicaWindow: IWindow
  let replicaDocument: IDocument

  beforeEach(() => {
    window = new Window({ url: 'https://www.somesite.com/test.html' })
    document = window.document

    replicaWindow = new Window({ url: 'https://www.somesite.com/test.html' })
    replicaDocument = replicaWindow.document

    initTestReplicaDom(window, replicaWindow)
  })

  afterEach(() => {
    expect(replicaDocument.body?.outerHTML).toBe(document.body?.outerHTML)

    const primarySerialized = serializeDomNode(document.body, window)
    const replicaSerialized = serializeDomNode(replicaDocument.body, replicaWindow)
    expect(replicaSerialized).toEqual(primarySerialized)
  })

  function testElement(type: string) {
    return addTestElement(
      document,
      replicaDocument,
      type,
      'createElement',
    ) as {
      primary: IHTMLAnchorElement
      replica: IHTMLAnchorElement
    }
  }

  for (const property of [
    'download',
    'hreflang',
    'ping',
    'target',
    'referrerPolicy',
    'rel',
    'type',
  ]) {
    describe(`get ${property}()`, () => {
      it(`returns the "`, () => {
        const { primary, replica } = testElement('a')
        primary.setAttribute(property, 'test')
        // @ts-expect-error property should exist
        expect(replica[property]).toBe('test')
      })
    })

    describe(`set ${property}()`, () => {
      it(`sets the attribute "`, () => {
        const { primary, replica } = testElement('a')
        // @ts-expect-error property should exist
        primary[property] = 'test'
        expect(replica.getAttribute(property)).toBe('test')
      })
    })
  }

  describe('get href()', () => {
    it('returns the "href" attribute.', () => {
      const { primary, replica } = testElement('a')
      primary.setAttribute('href', 'test')
      expect(replica.href).toBe('https://www.somesite.com/test')
    })

    it('returns the "href" attribute when scheme is http.', () => {
      const { primary, replica } = testElement('a')
      primary.setAttribute('href', 'http://www.example.com')
      expect(replica.href).toBe('http://www.example.com/')
    })

    it('returns the "href" attribute when scheme is tel.', () => {
      const { primary, replica } = testElement('a')
      primary.setAttribute('href', 'tel:+123456789')
      expect(replica.href).toBe('tel:+123456789')
    })

    it('returns the "href" attribute when scheme-relative', () => {
      const { primary, replica } = testElement('a')
      primary.setAttribute('href', '//example.com')
      expect(replica.href).toBe('https://example.com/')
    })

    it('returns empty string if "href" attribute is empty.', () => {
      const { replica } = testElement('a')
      expect(replica.href).toBe('')
    })
  })

  describe('toString()', () => {
    it('returns the "href" attribute.', () => {
      const { primary, replica } = testElement('a')
      primary.setAttribute('href', 'test')
      expect(replica.toString()).toBe('https://www.somesite.com/test')
    })

    it('returns the "href" attribute when scheme is http.', () => {
      const { primary, replica } = testElement('a')
      primary.setAttribute('href', 'http://www.example.com')
      expect(replica.toString()).toBe('http://www.example.com/')
    })

    it('returns the "href" attribute when scheme is tel.', () => {
      const { primary, replica } = testElement('a')
      primary.setAttribute('href', 'tel:+123456789')
      expect(replica.toString()).toBe('tel:+123456789')
    })

    it('returns the "href" attribute when scheme-relative', () => {
      const { primary, replica } = testElement('a')
      primary.setAttribute('href', '//example.com')
      expect(replica.toString()).toBe('https://example.com/')
    })

    it('returns empty string if "href" attribute is empty.', () => {
      const { replica } = testElement('a')
      expect(replica.toString()).toBe('')
    })
  })

  describe('set href()', () => {
    it('sets the attribute "href".', () => {
      const { primary, replica } = testElement('a')
      primary.href = 'test'
      expect(replica.getAttribute('href')).toBe('test')
    })

    it('can be set after a blob URL has been defined.', () => {
      const { primary, replica } = testElement('a')
      primary.href = BLOB_URL
      expect(replica.href).toBe(BLOB_URL)
      primary.href = 'https://example.com/'
      expect(replica.href).toBe('https://example.com/')
    })
  })

  describe('get origin()', () => {
    it('returns the href URL\'s origin.', () => {
      const { primary, replica } = testElement('a')
      primary.setAttribute('href', 'https://www.example.com:443/path?q1=a#xyz')
      expect(replica.origin).toBe('https://www.example.com')
    })

    it('returns the href URL\'s origin with port when non-standard.', () => {
      const { primary, replica } = testElement('a')
      primary.setAttribute('href', 'http://www.example.com:8080/path?q1=a#xyz')
      expect(replica.origin).toBe('http://www.example.com:8080')
    })

    it('returns the page\'s origin when href is relative.', () => {
      const { primary, replica } = testElement('a')
      primary.setAttribute('href', '/path?q1=a#xyz')
      expect(replica.origin).toBe('https://www.somesite.com')
    })
  })

  describe('get protocol()', () => {
    it('returns the href URL\'s protocol.', () => {
      const { primary, replica } = testElement('a')
      primary.setAttribute('href', 'https://www.example.com:443/path?q1=a#xyz')
      expect(replica.protocol).toBe('https:')
    })
  })

  describe('set protocol()', () => {
    it('sets the href URL\'s protocol.', () => {
      const { primary, replica } = testElement('a')
      primary.setAttribute('href', 'https://www.example.com:443/path?q1=a#xyz')

      expect(replica.protocol).toBe('https:')

      primary.protocol = 'http'
      expect(replica.protocol).toBe('http:')
      expect(replica.href).toBe('http://www.example.com/path?q1=a#xyz')
    })

    it('can\'t be modified on blob URLs.', () => {
      const { primary, replica } = testElement('a')
      primary.href = BLOB_URL
      primary.protocol = 'http'
      expect(replica.protocol).toBe('blob:')
    })
  })

  describe('get username()', () => {
    it('returns the href URL\'s username.', () => {
      const { primary, replica } = testElement('a')
      primary.setAttribute('href', 'https://user:pw@www.example.com:443/path?q1=a#xyz')
      expect(replica.username).toBe('user')
    })
  })

  describe('set username()', () => {
    it('sets the href URL\'s username.', () => {
      const { primary, replica } = testElement('a')
      primary.setAttribute('href', 'https://user:pw@www.example.com:443/path?q1=a#xyz')

      expect(replica.username).toBe('user')

      primary.username = 'user2'
      expect(replica.username).toBe('user2')
      expect(replica.href).toBe('https://user2:pw@www.example.com/path?q1=a#xyz')
    })

    it('can\'t be modified on blob URLs.', () => {
      const { primary, replica } = testElement('a')
      primary.href = BLOB_URL
      primary.username = 'user2'
      expect(replica.username).toBe('')
    })
  })

  describe('get password()', () => {
    it('returns the href URL\'s password.', () => {
      const { primary, replica } = testElement('a')
      primary.setAttribute('href', 'https://user:pw@www.example.com:443/path?q1=a#xyz')
      expect(replica.password).toBe('pw')
    })
  })

  describe('set password()', () => {
    it('sets the href URL\'s password.', () => {
      const { primary, replica } = testElement('a')
      primary.setAttribute('href', 'https://user:pw@www.example.com:443/path?q1=a#xyz')

      expect(replica.password).toBe('pw')

      primary.password = 'pw2'
      expect(replica.password).toBe('pw2')
      expect(replica.href).toBe('https://user:pw2@www.example.com/path?q1=a#xyz')
    })

    it('can\'t be modified on blob URLs.', () => {
      const { primary, replica } = testElement('a')
      primary.href = BLOB_URL
      primary.password = 'pw2'
      expect(replica.password).toBe('')
    })
  })

  describe('get host()', () => {
    it('returns the href URL\'s host.', () => {
      const { primary, replica } = testElement('a')
      primary.setAttribute('href', 'https://www.example.com:443/path?q1=a#xyz')
      expect(replica.host).toBe('www.example.com')
    })
  })

  describe('set host()', () => {
    it('sets the href URL\'s host.', () => {
      const { primary, replica } = testElement('a')
      primary.setAttribute('href', 'https://www.example.com:443/path?q1=a#xyz')

      expect(replica.host).toBe('www.example.com')

      primary.host = 'abc.example2.com'
      expect(replica.host).toBe('abc.example2.com')
      expect(replica.href).toBe('https://abc.example2.com/path?q1=a#xyz')
    })

    it('can\'t be modified on blob URLs.', () => {
      const { primary, replica } = testElement('a')
      primary.href = BLOB_URL
      primary.host = 'abc.example2.com'
      expect(replica.host).toBe('')
    })
  })

  describe('get hostname()', () => {
    it('returns the href URL\'s hostname.', () => {
      const { primary, replica } = testElement('a')
      primary.setAttribute('href', 'https://www.example.com:443/path?q1=a#xyz')
      expect(replica.hostname).toBe('www.example.com')
    })
  })

  describe('set hostname()', () => {
    it('sets the href URL\'s hostname.', () => {
      const { primary, replica } = testElement('a')
      primary.setAttribute('href', 'https://www.example.com:443/path?q1=a#xyz')

      expect(replica.hostname).toBe('www.example.com')

      primary.hostname = 'abc.example2.com'
      expect(replica.hostname).toBe('abc.example2.com')
      expect(replica.href).toBe('https://abc.example2.com/path?q1=a#xyz')
    })

    it('can\'t be modified on blob URLs.', () => {
      const { primary, replica } = testElement('a')
      primary.href = BLOB_URL
      primary.hostname = 'abc.example2.com'
      expect(replica.hostname).toBe('')
    })
  })

  describe('get port()', () => {
    it('returns the href URL\'s port.', () => {
      const { primary, replica } = testElement('a')
      primary.setAttribute('href', 'https://www.example.com:443/path?q1=a#xyz')
      expect(replica.port).toBe('')

      primary.setAttribute('href', 'https://www.example.com:444/path?q1=a#xyz')
      expect(replica.port).toBe('444')
    })
  })

  describe('set port()', () => {
    it('sets the href URL\'s port.', () => {
      const { primary, replica } = testElement('a')
      primary.setAttribute('href', 'https://www.example.com:443/path?q1=a#xyz')

      expect(replica.port).toBe('')

      primary.port = '8080'
      expect(replica.port).toBe('8080')
      expect(replica.href).toBe('https://www.example.com:8080/path?q1=a#xyz')
    })

    it('can\'t be modified on blob URLs.', () => {
      const { primary, replica } = testElement('a')
      primary.href = BLOB_URL
      primary.port = '8080'
      expect(replica.port).toBe('')
    })
  })

  describe('get pathname()', () => {
    it('returns the href URL\'s pathname.', () => {
      const { primary, replica } = testElement('a')
      primary.setAttribute('href', 'https://www.example.com:443/path?q1=a#xyz')
      expect(replica.pathname).toBe('/path')
    })
  })

  describe('set pathname()', () => {
    it('sets the href URL\'s pathname.', () => {
      const { primary, replica } = testElement('a')
      primary.setAttribute('href', 'https://www.example.com:443/path?q1=a#xyz')

      expect(replica.pathname).toBe('/path')

      primary.pathname = '/path2'
      expect(replica.pathname).toBe('/path2')
      expect(replica.href).toBe('https://www.example.com/path2?q1=a#xyz')
    })

    it('can\'t be modified on blob URLs.', () => {
      const { primary, replica } = testElement('a')
      primary.href = BLOB_URL
      primary.pathname = '/path2'
      expect(replica.pathname).toBe(BLOB_URL.split(':').slice(1).join(':'))
    })
  })

  describe('get search()', () => {
    it('returns the href URL\'s search.', () => {
      const { primary, replica } = testElement('a')
      primary.setAttribute('href', 'https://www.example.com:443/path?q1=a#xyz')
      expect(replica.search).toBe('?q1=a')
    })
  })

  describe('set search()', () => {
    it('sets the href URL\'s search.', () => {
      const { primary, replica } = testElement('a')
      primary.setAttribute('href', 'https://www.example.com:443/path?q1=a#xyz')

      expect(replica.search).toBe('?q1=a')

      primary.search = '?q1=b'
      expect(replica.search).toBe('?q1=b')
      expect(replica.href).toBe('https://www.example.com/path?q1=b#xyz')
    })

    it('can\'t be modified on blob URLs.', () => {
      const { primary, replica } = testElement('a')
      primary.href = BLOB_URL
      primary.search = '?q1=b'
      expect(replica.search).toBe('')
    })
  })

  describe('get hash()', () => {
    it('returns the href URL\'s hash.', () => {
      const { primary, replica } = testElement('a')
      primary.setAttribute('href', 'https://www.example.com:443/path?q1=a#xyz')
      expect(replica.hash).toBe('#xyz')
    })
  })

  describe('set hash()', () => {
    it('sets the href URL\'s hash.', () => {
      const { primary, replica } = testElement('a')
      primary.setAttribute('href', 'https://www.example.com:443/path?q1=a#xyz')

      expect(replica.hash).toBe('#xyz')

      primary.hash = '#fgh'
      expect(replica.hash).toBe('#fgh')
      expect(replica.href).toBe('https://www.example.com/path?q1=a#fgh')
    })

    it('can be modified on blob URLs.', () => {
      const { primary, replica } = testElement('a')
      primary.href = BLOB_URL
      primary.hash = '#fgh'
      expect(replica.hash).toBe('')
    })
  })
})
