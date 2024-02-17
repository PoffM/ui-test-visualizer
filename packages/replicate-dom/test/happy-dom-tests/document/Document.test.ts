/*
  This file is derived from:
  https://github.com/capricorn86/happy-dom/blob/6cbcc10a1a227b36e38a7bc33203b2ae029cca95/packages/happy-dom/test/nodes/document/Document.test.ts ,
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
import type { Element, HTMLTemplateElement, IDocument, IHTMLElement, IShadowRoot, IWindow } from 'happy-dom'
import { initTestReplicaDom } from '../../test-setup'

describe('document', () => {
  let window: IWindow
  let document: IDocument

  let replicaWindow: IWindow
  let replicaDocument: IDocument

  beforeEach(() => {
    window = new Window()
    document = window.document

    replicaWindow = new Window()
    replicaDocument = replicaWindow.document

    initTestReplicaDom(window, replicaWindow)
  })

  afterEach(() => {
    expect(replicaDocument.body?.outerHTML.replace(/\ type="no-execute"/gm, ''))
      .toBe(document.body?.outerHTML)
  })

  for (const property of ['charset', 'characterSet']) {
    describe(`get ${property}()`, () => {
      it('returns the value of a "charset" attribute set in a meta element.', () => {
        const meta = document.createElement('meta')

        meta.setAttribute('charset', 'windows-1252')

        document.head.appendChild(meta)

        // @ts-expect-error property should exist
        expect(replicaDocument[property]).toBe('windows-1252')
      })
    })
  }

  describe('get children()', () => {
    it('returns Element child nodes.', () => {
      document.appendChild(document.createTextNode('test'))
      expect(replicaDocument.children.length).toEqual(1)
      expect(replicaDocument.children[0] === replicaDocument.documentElement).toBe(true)
    })
  })

  describe('get links()', () => {
    it('returns a elements.', () => {
      const link1 = document.createElement('a')
      const link2 = document.createElement('a')
      link1.setAttribute('href', '')

      document.body.appendChild(link1)
      document.body.appendChild(link2)

      expect(replicaDocument.links.length).toBe(1)

      link2.setAttribute('href', '')
      expect(replicaDocument.links.length).toBe(2)
    })
  })

  describe('get scripts()', () => {
    it('returns script elements.', () => {
      const div = document.createElement('div')
      const span1 = document.createElement('span')
      const span2 = document.createElement('span')
      const script1 = document.createElement('script')
      const script2 = document.createElement('script')

      span1.appendChild(script1)
      span2.appendChild(script2)

      div.appendChild(span1)
      div.appendChild(span2)

      document.body.appendChild(div)

      expect(replicaDocument.scripts.length).toBe(2)
    })
  })

  describe('get childElementCount()', () => {
    it('returns child element count.', () => {
      document.appendChild(document.createElement('div'))
      document.appendChild(document.createTextNode('test'))
      expect(replicaDocument.childElementCount).toEqual(2)
    })
  })

  describe('get cookie()', () => {
    it('returns cookie string.', () => {
      document.cookie = 'name=value1'
      expect(replicaDocument.cookie).toBe('name=value1')
    })
  })

  describe('set cookie()', () => {
    it('sets multiple cookies.', () => {
      document.cookie = 'name1=value1'
      document.cookie = 'name2=value2'
      expect(replicaDocument.cookie).toBe('name1=value1; name2=value2')
    })

    it('replaces cookie with the same name, but treats cookies with no value set differently from cookies with a value.', () => {
      document.cookie = 'name=value1'
      document.cookie = 'name'
      document.cookie = 'name=value2'
      document.cookie = 'name'
      expect(replicaDocument.cookie).toBe('name=value2; name')
    })

    // TODO handle the parent window?

    // it('sets a cookie with a domain.', () => {
    //   window.location.href = 'https://test.com'
    //   document.cookie = 'name=value1; domain=test.com'
    //   expect(replicaDocument.cookie).toBe('name=value1')
    // })

    // it('sets a cookie with an invalid domain.', () => {
    //   window.location.href = 'https://test.com'
    //   document.cookie = 'name=value1; domain=invalid.com'
    //   expect(replicaDocument.cookie).toBe('')
    // })

    // it('sets a cookie on a top-domain from a sub-domain.', () => {
    //   window.location.href = 'https://sub.test.com'
    //   document.cookie = 'name=value1; domain=test.com'
    //   expect(replicaDocument.cookie).toBe('name=value1')
    // })

    // it('sets a cookie with a path.', () => {
    //   window.location.href = 'https://sub.test.com/path/to/cookie/'
    //   document.cookie = 'name1=value1; path=path/to'
    //   document.cookie = 'name2=value2; path=/path/to'
    //   document.cookie = 'name3=value3; path=/path/to/cookie/'
    //   expect(replicaDocument.cookie).toBe('name1=value1; name2=value2; name3=value3')
    // })

    // it('does not set cookie if the path does not match the current path.', () => {
    //   window.location.href = 'https://sub.test.com/path/to/cookie/'
    //   document.cookie = 'name1=value1; path=/cookie/'
    //   expect(replicaDocument.cookie).toBe('')
    // })

    it('sets a cookie if it expires is in the future.', () => {
      const date = new Date()
      const oneHour = 3600000
      date.setTime(date.getTime() + oneHour)
      const expires = date.toUTCString()
      document.cookie = `name=value1; expires=${expires}`
      expect(replicaDocument.cookie).toBe('name=value1')
    })

    it('does not set cookie if "expires" is in the past.', () => {
      document.cookie = 'name=value1; expires=Thu, 01 Jan 1970 00:00:01 GMT'
      expect(replicaDocument.cookie).toBe('')
    })

    it('unset previous cookie.', () => {
      document.cookie = 'name=Dave; expires=Thu, 01 Jan 2030 00:00:00 GMT;'
      expect(replicaDocument.cookie).toBe('name=Dave')
      document.cookie = 'name=; expires=Thu, 01 Jan 1970 00:00:00 GMT;'
      expect(replicaDocument.cookie).toBe('')
    })

    it('removes a previously defined cookie if "expires" is in the past, but treats cookies with no value set differently from cookies with a value.', () => {
      document.cookie = 'name=value1'
      document.cookie = 'name'
      document.cookie = 'name=value1; expires=Thu, 01 Jan 1970 00:00:01 GMT'
      expect(replicaDocument.cookie).toBe('name')
      document.cookie = 'name; expires=Thu, 01 Jan 1970 00:00:01 GMT'
      expect(replicaDocument.cookie).toBe('')
    })
  })

  describe('get title() and set title()', () => {
    it('returns and sets title.', () => {
      document.title = 'test title'
      expect(replicaDocument.title).toBe('test title')
      const title = <Element>replicaDocument.head.querySelector('title')
      expect(title.textContent).toBe('test title')
      document.title = 'new title'
      expect(replicaDocument.title).toBe('new title')
      expect(title.textContent).toBe('new title')
      title.textContent = 'new title 2'
      expect(replicaDocument.title).toBe('new title 2')
    })
  })

  describe('get activeElement()', () => {
    it('returns the currently active element.', () => {
      const div = <IHTMLElement>document.createElement('div')
      const span = <IHTMLElement>document.createElement('span')

      document.appendChild(div)
      document.appendChild(span)

      expect(replicaDocument.activeElement.tagName).toBe('BODY')

      div.focus()

      expect(replicaDocument.activeElement.tagName).toBe('DIV')

      span.focus()

      expect(replicaDocument.activeElement.tagName).toBe('SPAN')

      span.blur()

      expect(replicaDocument.activeElement.tagName).toBe('BODY')
    })

    it('unsets the active element when it gets disconnected.', () => {
      const div = <IHTMLElement>document.createElement('div')

      document.appendChild(div)

      expect(replicaDocument.activeElement.tagName).toBe('BODY')

      div.focus()

      expect(replicaDocument.activeElement.tagName).toBe('DIV')

      div.remove()

      expect(replicaDocument.activeElement.tagName).toBe('BODY')
    })

    it('returns the first custom element that has document as root node when the focused element is nestled in multiple shadow roots.', () => {
      class CustomElementA extends (<Window>window).HTMLElement {
        constructor() {
          super()
          this.attachShadow({ mode: 'open' })
        }

        public connectedCallback(): void {
          (<IShadowRoot> this.shadowRoot).innerHTML = `
						<div>
							<custom-element-b></custom-element-b>
						</div>
					`
        }
      }
      class CustomElementB extends (<Window>window).HTMLElement {
        constructor() {
          super()
          this.attachShadow({ mode: 'open' })
        }

        public connectedCallback(): void {
          (<IShadowRoot> this.shadowRoot).innerHTML = `
						<div>
							<button tabindex="0"></button>
						</div>
					`
        }
      }

      window.customElements.define('custom-element-a', CustomElementA)
      window.customElements.define('custom-element-b', CustomElementB)

      const customElementA = document.createElement('custom-element-a')
      const div = document.createElement('div')
      div.appendChild(customElementA)

      document.body.appendChild(div)

      const button = <IHTMLElement>(
				(<IHTMLElement>(
					customElementA.shadowRoot.querySelector('custom-element-b')
				)).shadowRoot.querySelector('button')
			)

      let focusCalls = 0
      button.addEventListener('focus', () => focusCalls++)

      button.focus()
      button.focus()

      expect(replicaDocument.activeElement.tagName).toBe('CUSTOM-ELEMENT-A')
      expect(focusCalls).toBe(1)
    })
  })

  describe('get baseURI()', () => {
    it('returns location.href.', () => {
      document.location.href = 'https://localhost:8080/base/path/to/script/?key=value=1#test'

      expect(replicaDocument.baseURI).toBe('https://localhost:8080/base/path/to/script/?key=value=1#test')
    })

    it('returns the "href" attribute set on a <base> element.', () => {
      document.location.href = 'https://localhost:8080/base/path/to/script/?key=value=1#test'

      const base = document.createElement('base')
      base.setAttribute('href', 'https://www.test.test/base/path/to/script/?key=value=1#test')
      document.documentElement.appendChild(base)

      expect(replicaDocument.baseURI).toBe('https://www.test.test/base/path/to/script/?key=value=1#test')
    })
  })

  describe('uRL', () => {
    it('returns the URL of the document.', () => {
      document.location.href = 'http://localhost:8080/path/to/file.html'
      expect(replicaDocument.URL).toBe('http://localhost:8080/path/to/file.html')
    })
  })
  describe('documentURI', () => {
    it('returns the documentURI of the document.', () => {
      document.location.href = 'http://localhost:8080/path/to/file.html'
      expect(replicaDocument.documentURI).toBe('http://localhost:8080/path/to/file.html')
    })
  })

  describe('append()', () => {
    it('inserts a set of Node objects or DOMString objects after the last child of the ParentNode. DOMString objects are inserted as equivalent Text nodes.', () => {
      const node1 = document.createComment('test1')
      const node2 = document.createComment('test2')

      document.append(node1, node2)
      expect(replicaDocument.childNodes.length).toBe(4)
    })
  })

  describe('prepend()', () => {
    it('inserts a set of Node objects or DOMString objects before the first child of the ParentNode. DOMString objects are inserted as equivalent Text nodes.', () => {
      const node1 = document.createComment('test1')
      const node2 = document.createComment('test2')

      document.prepend(node1, node2)
      expect(replicaDocument.childNodes.length).toBe(4)
    })
  })

  describe('replaceChildren()', () => {
    it('replaces the existing children of a ParentNode with a specified new set of children.', () => {
      const node1 = document.createComment('test1')
      const node2 = document.createComment('test2')

      document.replaceChildren(node1, node2)
      expect(replicaDocument.childNodes.length).toBe(2)
    })
  })

  describe('appendChild()', () => {
    it('updates the children property when appending an element child.', () => {
      const div = document.createElement('div')
      const span = document.createElement('span')

      for (const node of document.childNodes.slice()) {
        node.parentNode!.removeChild(node)
      }

      document.appendChild(document.createComment('test'))
      document.appendChild(div)
      document.appendChild(document.createComment('test'))
      document.appendChild(span)

      expect(replicaDocument.children.length).toBe(2)
      expect(replicaDocument.children[0]!.tagName).toBe('DIV')
      expect(replicaDocument.children[1]!.tagName).toBe('SPAN')
    })

    // See: https://developer.mozilla.org/en-US/docs/Web/API/DocumentFragment
    it('append the children instead of the actual element if the type is DocumentFragment.', () => {
      const template = <HTMLTemplateElement>document.createElement('template')

      template.innerHTML = '<div>Div</div><span>Span</span>'

      const clone = template.content.cloneNode(true)

      for (const node of document.childNodes.slice()) {
        node.parentNode!.removeChild(node)
      }

      document.appendChild(clone)

      expect(clone.childNodes.length).toBe(0)
      expect(clone.children.length).toBe(0)
      expect(replicaDocument.children.map(child => child.outerHTML).join('')).toBe(
        '<div>Div</div><span>Span</span>',
      )
    })
  })

  describe('removeChild()', () => {
    it('updates the children property when removing an element child.', () => {
      const div = document.createElement('div')
      const span = document.createElement('span')

      for (const node of document.childNodes.slice()) {
        node.parentNode!.removeChild(node)
      }

      document.appendChild(document.createComment('test'))
      document.appendChild(div)
      document.appendChild(document.createComment('test'))
      document.appendChild(span)

      document.removeChild(div)

      expect(replicaDocument.children.length).toBe(1)
      expect(replicaDocument.children[0]!.tagName).toBe('SPAN')
    })
  })

  describe('insertBefore()', () => {
    it('updates the children property when appending an element child.', () => {
      const div1 = document.createElement('div')
      const div2 = document.createElement('div')
      const span = document.createElement('span')

      for (const node of document.childNodes.slice()) {
        node.parentNode!.removeChild(node)
      }

      document.appendChild(document.createComment('test'))
      document.appendChild(div1)
      document.appendChild(document.createComment('test'))
      document.appendChild(span)
      document.insertBefore(div2, div1)

      expect(replicaDocument.children.length).toBe(3)
      expect(replicaDocument.children[0]!.tagName).toBe('DIV')
      expect(replicaDocument.children[1]!.tagName).toBe('DIV')
      expect(replicaDocument.children[2]!.tagName).toBe('SPAN')
    })

    // See: https://developer.mozilla.org/en-US/docs/Web/API/DocumentFragment
    it('insert the children instead of the actual element before another reference Node if the type is DocumentFragment.', () => {
      const child1 = document.createElement('span')
      const child2 = document.createElement('span')
      const template = <HTMLTemplateElement>document.createElement('template')

      template.innerHTML = '<div>Template DIV 1</div><span>Template SPAN 1</span>'

      const clone = template.content.cloneNode(true)

      for (const node of document.childNodes.slice()) {
        node.parentNode!.removeChild(node)
      }

      document.appendChild(child1)
      document.appendChild(child2)

      document.insertBefore(clone, child2)

      expect(replicaDocument.children.length).toBe(4)
      expect(replicaDocument.children.map(child => child.outerHTML).join('')).toBe(
        '<span></span><div>Template DIV 1</div><span>Template SPAN 1</span><span></span>',
      )
    })
  })

  describe('write()', () => {
    it('replaces the content of documentElement with new content the first time it is called and writes the body part to the body the second time.', () => {
      const html = `
				<html>
					<head>
						<title>Title</title>
					</head>
					<body>
						<span>Body</span>
					</body>
				</html>
			`
      document.write(html)
      document.write(html)
      expect(replicaDocument.documentElement.outerHTML.replace(/[\s]/gm, '')).toBe(
				`
				<html>
					<head>
						<title>Title</title>
					</head>
					<body>
						<span>Body</span>
						<span>Body</span>
					</body>
				</html>
				`.replace(/[\s]/gm, ''),
      )
    })

    it('adds elements outside of the <html> tag to the <body> tag.', () => {
      const html = `
				<html>
					<head>
						<title>Title</title>
					</head>
					<body>
						<span>Body</span>
					</body>
				</html>
				<div>Should be added to body</div>
			`
      document.write(html)
      expect(replicaDocument.documentElement.outerHTML.replace(/[\s]/gm, '')).toBe(
				`
				<html>
					<head>
						<title>Title</title>
					</head>
					<body>
						<span>Body</span>
						<div>Should be added to body</div>
					</body>
				</html>
				`.replace(/[\s]/gm, ''),
      )
    })

    it('adds elements outside of the <html> tag to the <body> tag. 2', () => {
      const html = `<html test="1"><body>Test></body></html>`
      document.write(html)
      expect(replicaDocument.documentElement.outerHTML).toBe(
        '<html test="1"><head></head><body>Test></body></html>',
      )
    })
  })

  describe('open()', () => {
    it('clears the document and opens it for writing.', () => {
      const html = `
				<html>
					<head>
						<title>Title</title>
					</head>
					<body>
						<span>Body</span>
					</body>
				</html>
			`
      document.write(html)
      document.open()
      document.write(html)
      expect(replicaDocument.documentElement.outerHTML.replace(/[\s]/gm, '')).toBe(
        html.replace(/[\s]/gm, ''),
      )
    })
  })
})
