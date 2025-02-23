/*
  This file is derived from:
  https://github.com/capricorn86/happy-dom/blob/6cbcc10a1a227b36e38a7bc33203b2ae029cca95/packages/happy-dom/test/nodes/node/Node.test.ts ,
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
import { DOMException, Event, Node, Text, Window } from 'happy-dom'
import type { Document, ErrorEvent, HTMLElement, HTMLTemplateElement, ShadowRoot, Window } from 'happy-dom'
import NodeFactory from '../../../node_modules/happy-dom/lib/nodes/NodeFactory'
import EventPhaseEnum from '../../../node_modules/happy-dom/lib/event/EventPhaseEnum'
import { addTestElement, initTestReplicaDom } from '../../test-setup'
import { serializeDomNode } from '../../../src'

let window: Window
let document: Document

let replicaWindow: Window
let replicaDocument: Document

let customElementOutput: any

function testElement(type: string) {
  return addTestElement<HTMLElement>(
    document,
    replicaDocument,
    type,
    'createElement',
  )
}

afterEach(() => {
  expect(replicaDocument.body.outerHTML).toBe(document.body.outerHTML)

  const primarySerialized = serializeDomNode(document.body, window)
  const replicaSerialized = serializeDomNode(replicaDocument.body, replicaWindow)
  expect(replicaSerialized).toEqual(primarySerialized)
})

describe('node', () => {
  beforeEach(() => {
    window = new Window()
    document = window.document

    replicaWindow = new Window()
    replicaDocument = replicaWindow.document

    initTestReplicaDom(window, replicaWindow)

    /**
     *
     */
    class CustomCounterElement extends window.HTMLElement {
      public static output: string[] = []

      /**
       * Constructor.
       */
      constructor() {
        super()
        this.attachShadow({ mode: 'open' })
      }

      /**
       * Connected.
       */
      public connectedCallback(): void {
        (<ShadowRoot> this.shadowRoot).innerHTML = '<div><span>Test</span></div>';
        (<typeof CustomCounterElement> this.constructor).output.push('Counter:connected')
      }

      /**
       * Disconnected.
       */
      public disconnectedCallback(): void {
        (<typeof CustomCounterElement> this.constructor).output.push('Counter:disconnected')
      }
    }

    /**
     *
     */
    class CustomButtonElement extends window.HTMLElement {
      public static output: string[] = []

      /**
       * Connected.
       */
      public connectedCallback(): void {
        (<typeof CustomButtonElement> this.constructor).output.push('Button:connected')
      }

      /**
       * Disconnected.
       */
      public disconnectedCallback(): void {
        (<typeof CustomButtonElement> this.constructor).output.push('Button:disconnected')
      }
    }

    customElementOutput = []
    CustomCounterElement.output = customElementOutput
    CustomButtonElement.output = customElementOutput
    window.customElements.define('custom-counter', CustomCounterElement)
    window.customElements.define('custom-button', CustomButtonElement)
  })

  describe('get isConnected()', () => {
    it('returns "true" if the node is connected to the document.', () => {
      const div = document.createElement('div')
      const span = document.createElement('span')
      const text = document.createTextNode('text')

      div.appendChild(span)
      span.appendChild(text)

      expect(div.isConnected).toBe(false)
      expect(span.isConnected).toBe(false)
      expect(text.isConnected).toBe(false)

      document.body.appendChild(div)

      const replicaDiv = replicaDocument.querySelector('div')!
      const replicaSpan = replicaDocument.querySelector('span')!

      expect(replicaDiv.isConnected).toBe(true)
      expect(replicaSpan.isConnected).toBe(true)
      expect(text.isConnected).toBe(true)

      expect(replicaSpan.textContent).toBe('text')
    })
  })

  describe('get childNodes()', () => {
    it('returns child nodes.', () => {
      const { primary, replica } = testElement('div')

      const span = document.createElement('span')
      const text = document.createTextNode('text')
      const comment = document.createComment('comment')

      primary.appendChild(span)
      primary.appendChild(text)
      primary.appendChild(comment)

      expect(replica.childNodes.length).toBe(3)
      // @ts-expect-error property should exist
      expect(replica.childNodes[0]!.tagName).toBe('SPAN')
      expect(replica.childNodes[1]!.nodeType).toBe(3)
      expect(replica.childNodes[2]!.nodeType).toBe(8)
    })
    it('is a getter.', () => {
      expect(typeof Object.getOwnPropertyDescriptor(Node.prototype, 'childNodes')?.get).toBe(
        'function',
      )
    })
  })

  describe('get nodeValue()', () => {
    it('returns null.', () => {
      expect(NodeFactory.createNode(document, Node).nodeValue).toBe(null)
    })
  })

  describe('get nodeName()', () => {
    it('returns emptry string.', () => {
      expect(NodeFactory.createNode(document, Node).nodeName).toBe('')
    })
  })

  describe('get previousSibling()', () => {
    it('returns previous sibling.', () => {
      const div = document.createElement('div')
      const span1 = document.createElement('span')
      const span2 = document.createElement('span')
      const text = document.createTextNode('text')

      div.appendChild(span1)
      div.appendChild(text)
      div.appendChild(span2)

      expect(span2.previousSibling.textContent).toBe('text')
    })
  })

  describe('get nextSibling()', () => {
    it('returns next sibling.', () => {
      const { primary, replica } = testElement('div')
      const span1 = document.createElement('span')
      const span2 = document.createElement('span')
      const text = document.createTextNode('text')

      primary.appendChild(span1)
      primary.appendChild(text)
      primary.appendChild(span2)

      const replicaText = replica.childNodes[1]!

      expect(text.nextSibling).toBe(span2)
      expect(replicaText.textContent).toBe('text')
    })
  })

  describe('get firstChild()', () => {
    it('returns the first child node.', () => {
      const { primary, replica } = testElement('div')
      const span1 = document.createElement('span')
      const span2 = document.createElement('span')
      const text = document.createTextNode('text')

      primary.appendChild(span1)
      primary.appendChild(text)
      primary.appendChild(span2)

			 // @ts-expect-error property should exist
      expect(replica.firstChild.tagName).toBe('SPAN')
    })
  })

  describe('get lastChild()', () => {
    it('returns the last child node.', () => {
      const { primary, replica } = testElement('div')
      const span1 = document.createElement('span')
      const span2 = document.createElement('span')
      span2.id = 'span2'
      const text = document.createTextNode('text')

      primary.appendChild(span1)
      primary.appendChild(text)
      primary.appendChild(span2)

      // @ts-expect-error property should exist
      expect(replica.lastChild.id).toBe('span2')
    })
  })

  describe('get parentElement()', () => {
    it('returns parent element.', () => {
      const { primary } = testElement('div')
      const span1 = document.createElement('span')
      const text = document.createTextNode('text')

      span1.appendChild(text)
      primary.appendChild(span1)

      expect(text.parentElement).toBe(span1)
    })

    it('returns document element.', () => {
      const text1 = document.createTextNode('text1')
      const text2 = document.createTextNode('text2')
      const text3 = document.createTextNode('text3')

      text1.appendChild(text2)
      text2.appendChild(text3)

      document.documentElement.appendChild(text1)

      expect(text3.parentElement).toBe(document.documentElement)
    })

    it('returns null if there is no parent node.', () => {
      const text = document.createTextNode('text')

      expect(text.parentElement).toBe(null)
    })

    it('returns null if parent node is not an element.', () => {
      const htmlElement = document.createElement('html')
      document.appendChild(htmlElement)

      expect(htmlElement.parentNode).toBe(document)
      expect(htmlElement.parentElement).toBe(null)
    })
  })

  describe('get baseURI()', () => {
    it('returns location.href.', () => {
      document.location.href = 'https://localhost:8080/base/path/to/script/?key=value=1#test'

      const { replica } = testElement('div')
      expect(replica.baseURI).toBe('https://localhost:8080/base/path/to/script/?key=value=1#test')
    })

    it('returns the "href" attribute set on a <base> element.', () => {
      document.location.href = 'https://localhost:8080/base/path/to/script/?key=value=1#test'

      const base = document.createElement('base')
      base.setAttribute('href', 'https://www.test.test/base/path/to/script/?key=value=1#test')
      document.documentElement.appendChild(base)

      const div = document.createElement('div')
      expect(div.baseURI).toBe('https://www.test.test/base/path/to/script/?key=value=1#test')
    })
  })

  describe('connectedCallback()', () => {
    it('calls connected callback when a custom element is connected to DOM.', () => {
      document.body.innerHTML = '<custom-counter><custom-button></custom-button></custom-counter>'

      const primarySerialized = serializeDomNode(document.body, window)
      const replicaSerialized = serializeDomNode(replicaDocument.body, replicaWindow)

      expect(replicaSerialized).toEqual(primarySerialized)

      document.body.innerHTML = ''
      expect(customElementOutput).toEqual([
        'Counter:connected',
        'Button:connected',
        'Counter:disconnected',
        'Button:disconnected',
      ])
    })
  })

  describe('disconnectedCallback()', () => {
    it('calls disconnected callback when a custom element is connected to DOM.', () => {
      const customElement = document.createElement('custom-counter')
      let isConnected = false
      let isDisconnected = false

      customElement.connectedCallback = () => {
        isConnected = true
      }

      customElement.disconnectedCallback = () => {
        isDisconnected = true
      }

      document.body.appendChild(customElement)

      expect(isConnected).toBe(true)
      expect(isDisconnected).toBe(false)

      document.body.removeChild(customElement)

      expect(isDisconnected).toBe(true)
    })
  })

  describe('hasChildNodes()', () => {
    it('returns "true" if the Node has child nodes.', () => {
      const { primary, replica } = testElement('div')

      const child = document.createElement('span')

      expect(replica.hasChildNodes()).toBe(false)

      primary.appendChild(child)

      expect(replica.hasChildNodes()).toBe(true)
    })
  })

  describe('contains()', () => {
    it('returns "true" if a node contains another node.', () => {
      const { primary } = testElement('div')
      const span1 = document.createElement('span')
      const span2 = document.createElement('span')
      const text = document.createTextNode('text')

      primary.appendChild(span1)
      primary.appendChild(span2)

      expect(primary.contains(text)).toBe(false)

      span2.appendChild(text)

      expect(primary.contains(text)).toBe(true)
    })

    it('returns "false" if match node is null.', () => {
      const { replica } = testElement('div')

      expect(replica.contains(null)).toBe(false)
    })
  })

  describe('getRootNode()', () => {
    it('returns ShadowRoot when used on a node inside a ShadowRoot.', () => {
      const customElement = document.createElement('custom-counter')

      document.body.appendChild(customElement)

      const rootNode = (<ShadowRoot>customElement.shadowRoot).querySelector('span')?.getRootNode()

      expect(rootNode === customElement.shadowRoot).toBe(true)
    })

    it('returns Document when used on a node inside a ShadowRoot and the option "composed" is set to "true".', () => {
      const customElement = document.createElement('custom-counter')

      document.body.appendChild(customElement)

      const rootNode = (<ShadowRoot>customElement.shadowRoot)
        .querySelector('span')
        ?.getRootNode({ composed: true })

      expect(rootNode === document).toBe(true)
    })

    it('returns Document when the node is not inside a ShadowRoot.', () => {
      const divElement = document.createElement('div')
      const spanElement = document.createElement('span')

      divElement.appendChild(spanElement)
      document.body.appendChild(divElement)

      const rootNode = spanElement.getRootNode()

      expect(rootNode === document).toBe(true)
    })

    it('returns Document when called on Document', () => {
      expect(document.getRootNode() === document).toBe(true)
      expect(replicaDocument.getRootNode() === replicaDocument).toBe(true)
    })
  })

  describe('appendChild()', () => {
    it('appends an Node to another Node.', () => {
      const child = document.createElement('span')
      const parent1 = document.createElement('div')
      const parent2 = document.createElement('div')

      parent1.appendChild(child)

      expect(child.parentNode).toBe(parent1)
      expect(Array.from(parent1.childNodes)).toEqual([child])

      parent2.appendChild(child)
      expect(child.parentNode).toBe(parent2)
      expect(Array.from(parent1.childNodes)).toEqual([])
      expect(Array.from(parent2.childNodes)).toEqual([child])

      expect(child.isConnected).toBe(false)

      document.body.appendChild(parent2)

      expect(child.isConnected).toBe(true)
    })

    // See: https://developer.mozilla.org/en-US/docs/Web/API/DocumentFragment
    it('append the child nodes instead of the actual node if the type is DocumentFragment.', () => {
      const { primary, replica } = testElement('template')

      primary.innerHTML = '<div>Div</div><span>Span</span>'

      const div = document.createElement('div')
      const clone = (primary as HTMLTemplateElement).content.cloneNode(true)

      div.appendChild(clone)

      expect(Array.from(clone.childNodes)).toEqual([])

      expect(div.innerHTML).toBe('<div>Div</div><span>Span</span>')
      expect(replica.innerHTML).toBe('<div>Div</div><span>Span</span>')
    })

    it('throws an error if the node to append is the parent of the current node.', () => {
      const { primary } = testElement('div')
      const child1 = document.createElement('div')
      const child2 = document.createElement('div')
      child1.appendChild(child2)
      primary.appendChild(child1)
      try {
        child2.appendChild(primary)
      }
      catch (error) {
        expect(error).toEqual(
          new DOMException(
            'Failed to execute \'appendChild\' on \'Node\': The new node is a parent of the node to insert to.',
            'DOMException',
          ),
        )
      }
    })
  })

  describe('removeChild()', () => {
    it('removes a child Node from its parent and returns a reference to a removed node.', () => {
      const child = document.createElement('span')
      const parent = document.createElement('div')

      parent.appendChild(child)

      expect(child.parentNode).toBe(parent)
      expect(Array.from(parent.childNodes)).toEqual([child])
      expect(child.isConnected).toBe(false)

      document.body.appendChild(parent)

      expect(child.isConnected).toBe(true)

      const removed = parent.removeChild(child)

      expect(child.parentNode).toBe(null)
      expect(Array.from(parent.childNodes)).toEqual([])
      expect(child.isConnected).toBe(false)
      expect(removed).toEqual(child)
    })
  })

  describe('insertBefore()', () => {
    it('inserts a Node before another reference Node.', () => {
      const child1 = document.createElement('span')
      const child2 = document.createElement('span')
      const newNode = document.createElement('span')
      const parent = document.createElement('div')

      parent.appendChild(child1)
      parent.appendChild(child2)
      parent.insertBefore(newNode, child2)

      expect(newNode.parentNode).toBe(parent)
      expect(Array.from(parent.childNodes)).toEqual([child1, newNode, child2])
      expect(newNode.isConnected).toBe(false)

      document.body.appendChild(parent)

      expect(newNode.isConnected).toBe(true)
    })

    // See: https://developer.mozilla.org/en-US/docs/Web/API/DocumentFragment
    it('insert the child nodes instead of the actual node before another reference Node if the type is DocumentFragment.', () => {
      const child1 = document.createElement('span')
      const child2 = document.createElement('span')
      const template = <HTMLTemplateElement>document.createElement('template')
      const { primary, replica } = testElement('div')

      template.innerHTML = '<div>Template DIV 1</div><span>Template SPAN 1</span>'

      const clone = template.content.cloneNode(true)

      primary.appendChild(child1)
      primary.appendChild(child2)

      primary.insertBefore(clone, child2)

      expect(replica.innerHTML).toEqual(
        '<span></span><div>Template DIV 1</div><span>Template SPAN 1</span><span></span>',
      )
    })

    it('inserts a Node after all children if reference node is "null".', () => {
      const child1 = document.createElement('span')
      const child2 = document.createElement('span')
      const newNode = document.createElement('span')
      const parent = document.createElement('div')

      parent.appendChild(child1)
      parent.appendChild(child2)
      parent.insertBefore(newNode, null)

      expect(parent.childNodes[0]).toBe(child1)
      expect(parent.childNodes[1]).toBe(child2)
      expect(parent.childNodes[2]).toBe(newNode)
      expect(newNode.isConnected).toBe(false)

      document.body.appendChild(parent)

      expect(newNode.isConnected).toBe(true)
    })

    it('throws an exception if reference node is node sent.', () => {
      const { primary } = testElement('div')

      const child1 = document.createElement('span')
      const child2 = document.createElement('span')
      const newNode = document.createElement('span')

      primary.appendChild(child1)
      primary.appendChild(child2)

      expect(() => primary.insertBefore(newNode)).toThrow(
        'Failed to execute \'insertBefore\' on \'Node\': 2 arguments required, but only 1 present.',
      )
    })

    it('if reference node is null or undefined, the newNode should be inserted at the end of the peer node.', () => {
      const { primary, replica } = testElement('div')

      const child1 = document.createElement('span')
      const child2 = document.createElement('span')
      const newNode = document.createElement('span')
      const newNode1 = document.createElement('span')

      primary.appendChild(child1)
      primary.appendChild(child2)
      primary.insertBefore(newNode, null)
      primary.insertBefore(newNode1, undefined)

      expect(replica.childNodes[0]).toBeTruthy()
      expect(replica.childNodes[1]).toBeTruthy()
      expect(replica.childNodes[2]).toBeTruthy()
      expect(replica.childNodes[3]).toBeTruthy()
    })

    it('throws an exception if reference node is not child of parent node.', () => {
      const referenceNode = document.createElement('span')
      const newNode = document.createElement('span')
      const { primary } = testElement('div')

      expect(() => primary.insertBefore(newNode, referenceNode)).toThrow(
        'Failed to execute \'insertBefore\' on \'Node\': The node before which the new node is to be inserted is not a child of this node.',
      )
    })

    it('throws an error if the node to insert is the parent of the current node.', () => {
      const { primary } = testElement('div')

      const child1 = document.createElement('div')
      const child2 = document.createElement('div')

      child1.appendChild(child2)
      primary.appendChild(child1)

      try {
        child2.insertBefore(primary, null)
      }
      catch (error) {
        expect(error).toEqual(
          new DOMException(
            'Failed to execute \'insertBefore\' on \'Node\': The new node is a parent of the node to insert to.',
            'DOMException',
          ),
        )
      }
    })
  })

  describe('replaceChild()', () => {
    it('inserts a Node before another reference Node.', () => {
      const child1 = document.createElement('span')
      const child2 = document.createElement('span')
      const newNode = document.createElement('span')
      const parent = document.createElement('div')

      parent.appendChild(child1)
      parent.appendChild(child2)
      parent.replaceChild(newNode, child2)

      expect(newNode.parentNode).toBe(parent)
      expect(Array.from(parent.childNodes)).toEqual([child1, newNode])
      expect(newNode.isConnected).toBe(false)

      document.body.appendChild(parent)

      expect(newNode.isConnected).toBe(true)
    })
  })

  describe('dispatchEvent()', () => {
    it('dispatches an event that is set to not bubble.', () => {
      const { primary } = testElement('div')

      const child = document.createElement('span')
      const event = new Event('click', { bubbles: false })
      let childEvent: Event | null = null
      let parentEvent: Event | null = null

      primary.appendChild(child)

      child.addEventListener('click', event => (childEvent = event))
      primary.addEventListener('click', event => (parentEvent = event))

      expect(child.dispatchEvent(event)).toBe(true)

      expect(childEvent).toBe(event)
      expect((<Event>(<unknown>childEvent)).target).toBe(child)
      expect((<Event>(<unknown>childEvent)).currentTarget).toBe(child)
      expect(parentEvent).toBe(null)
    })

    it('dispatches an event that is set to bubble.', () => {
      const child = document.createElement('span')
      const { primary } = testElement('div')
      const event = new Event('click', { bubbles: true })
      let childEvent: Event | null = null
      let parentEvent: Event | null = null

      primary.appendChild(child)

      child.addEventListener('click', event => (childEvent = event))
      primary.addEventListener('click', event => (parentEvent = event))

      expect(child.dispatchEvent(event)).toBe(true)

      expect(childEvent).toBe(event)
      expect(parentEvent).toBe(event)
      expect((<Event>(<unknown>parentEvent)).target).toBe(child)
      expect((<Event>(<unknown>parentEvent)).currentTarget).toBe(window)
    })

    it('does not bubble to parent if propagation is stopped.', () => {
      const child = document.createElement('span')
      const { primary } = testElement('div')
      const event = new Event('click', { bubbles: false })
      let childEvent: Event | null = null
      let parentEvent: Event | null = null

      primary.appendChild(child)

      child.addEventListener('click', (event) => {
        event.stopPropagation()
        childEvent = event
      })
      primary.addEventListener('click', event => (parentEvent = event))

      expect(child.dispatchEvent(event)).toBe(true)

      expect(childEvent).toBe(event)
      expect(parentEvent).toBe(null)
    })

    it('returns false if preventDefault() is called and the event is cancelable.', () => {
      const child = document.createElement('span')
      const { primary } = testElement('div')
      const event = new Event('click', { bubbles: true, cancelable: true })
      let childEvent: Event | null = null
      let parentEvent: Event | null = null

      primary.appendChild(child)

      child.addEventListener('click', (event) => {
        event.preventDefault()
        childEvent = event
      })
      primary.addEventListener('click', event => (parentEvent = event))

      expect(child.dispatchEvent(event)).toBe(false)

      expect(childEvent).toBe(event)
      expect(parentEvent).toBe(event)
    })

    it('supports capture events that are not bubbles.', () => {
      const { primary } = testElement('div')
      const child1 = document.createElement('span')
      const child2 = document.createElement('span')

      child1.appendChild(child2)
      primary.appendChild(child1)

      const event = new Event('blur', { bubbles: false, cancelable: true })
      const parentEvents: Event[] = []
      const child1Events: Event[] = []
      const child2Events: Event[] = []

      primary.addEventListener(
        'blur',
        (event) => {
          expect(event.eventPhase).toBe(EventPhaseEnum.capturing)
          parentEvents.push(event)
        },
        true,
      )

      child1.addEventListener('blur', (event) => {
        expect(event.eventPhase).toBe(EventPhaseEnum.bubbling)
        child1Events.push(event)
      })

      child2.addEventListener('blur', (event) => {
        expect(event.eventPhase).toBe(EventPhaseEnum.atTarget)
        child2Events.push(event)
      })

      child2.dispatchEvent(event)

      expect(child1Events.length).toBe(0)
      expect(child2Events.length).toBe(1)
      expect(child2Events[0] === event).toBe(true)
      expect(parentEvents.length).toBe(1)
      expect(parentEvents[0] === event).toBe(true)
    })

    it('supports capture events that bubbles.', () => {
      const { primary } = testElement('div')
      const child1 = document.createElement('span')
      const child2 = document.createElement('span')

      child1.appendChild(child2)
      primary.appendChild(child1)

      const event = new Event('blur', { bubbles: true, cancelable: true })
      const parentEvents: Event[] = []
      const child1Events: Event[] = []
      const child2Events: Event[] = []

      primary.addEventListener(
        'blur',
        (event) => {
          expect(event.eventPhase).toBe(EventPhaseEnum.capturing)
          parentEvents.push(event)
        },
        true,
      )

      child1.addEventListener('blur', (event) => {
        expect(event.eventPhase).toBe(EventPhaseEnum.bubbling)
        child1Events.push(event)
      })

      child2.addEventListener('blur', (event) => {
        expect(event.eventPhase).toBe(EventPhaseEnum.atTarget)
        child2Events.push(event)
      })

      child2.dispatchEvent(event)

      expect(child1Events.length).toBe(1)
      expect(child1Events[0] === event).toBe(true)
      expect(child2Events.length).toBe(1)
      expect(child2Events[0] === event).toBe(true)
      expect(parentEvents.length).toBe(1)
      expect(parentEvents[0] === event).toBe(true)
    })

    it('supports capture events on document simulating what Test Library is doing when listenening to "blur" and "focus".', () => {
      const child1 = document.createElement('span')
      const child2 = document.createElement('span')

      child1.appendChild(child2)
      document.body.appendChild(child1)

      const event = new Event('blur', { bubbles: false, composed: true })
      const documentEvents: Event[] = []
      const child1Events: Event[] = []
      const child2Events: Event[] = []

      document.addEventListener(
        'blur',
        (event) => {
          expect(event.eventPhase).toBe(EventPhaseEnum.capturing)
          documentEvents.push(event)
        },
        {
          capture: true,
          passive: true,
        },
      )

      child1.addEventListener('blur', (event) => {
        expect(event.eventPhase).toBe(EventPhaseEnum.bubbling)
        child1Events.push(event)
      })

      child2.addEventListener('blur', (event) => {
        expect(event.eventPhase).toBe(EventPhaseEnum.atTarget)
        child2Events.push(event)
      })

      child2.dispatchEvent(event)

      expect(child1Events.length).toBe(0)
      expect(child2Events.length).toBe(1)
      expect(child2Events[0] === event).toBe(true)
      expect(documentEvents.length).toBe(1)
      expect(documentEvents[0] === event).toBe(true)
    })

    it('catches errors thrown in event listeners.', () => {
      const { primary } = testElement('div')
      const listener = (): void => {
        throw new Error('Test')
      }

      let errorEvent: ErrorEvent | null = null
      window.addEventListener('error', (event) => {
        errorEvent = <ErrorEvent>event
      })
      primary.addEventListener('click', listener)
      primary.dispatchEvent(new Event('click'))
      expect((<ErrorEvent>(<unknown>errorEvent)).error?.message).toBe('Test')
      expect(window.happyDOM?.virtualConsolePrinter?.readAsString().startsWith('Error: Test')).toBe(
        true,
      )
    })

    it('catches async errors thrown in event listeners.', async () => {
      const { primary } = testElement('div')
      const listener = async (): Promise<void> => {
        await new Promise(resolve => setTimeout(resolve, 0))
        throw new Error('Test')
      }

      let errorEvent: ErrorEvent | null = null
      window.addEventListener('error', (event) => {
        errorEvent = <ErrorEvent>event
      })
      primary.addEventListener('click', listener)
      primary.dispatchEvent(new Event('click'))
      await new Promise(resolve => setTimeout(resolve, 2))
      expect((<ErrorEvent>(<unknown>errorEvent)).error?.message).toBe('Test')
      expect(window.happyDOM?.virtualConsolePrinter?.readAsString().startsWith('Error: Test')).toBe(
        true,
      )
    })
  })

  describe('compareDocumentPosition()', () => {
    it('returns 0 if b is a', () => {
      const div = document.createElement('div')
      div.id = 'element'

      document.body.appendChild(div)

      expect(
        document
          .getElementById('element')
          .compareDocumentPosition(document.getElementById('element')),
      ).toEqual(0)
      expect(
        replicaDocument
          .getElementById('element')
          .compareDocumentPosition(replicaDocument.getElementById('element')),
      ).toEqual(0)
    })

    it('returns 4 if b is following a', () => {
      const div = document.createElement('div')
      const span1 = document.createElement('span')
      span1.id = 'span1'
      const span2 = document.createElement('span')
      span2.id = 'span2'

      div.appendChild(span1)
      div.appendChild(span2)
      document.body.appendChild(div)

      expect(
        document.getElementById('span1').compareDocumentPosition(document.getElementById('span2')),
      ).toEqual(4)
      expect(
        replicaDocument.getElementById('span1').compareDocumentPosition(replicaDocument.getElementById('span2')),
      ).toEqual(4)
    })

    it('returns 2 if b is preceding a', () => {
      const div = document.createElement('div')
      const span1 = document.createElement('span')
      span1.id = 'span1'
      const span2 = document.createElement('span')
      span2.id = 'span2'

      div.appendChild(span1)
      div.appendChild(span2)
      document.body.appendChild(div)

      expect(
        document.getElementById('span2').compareDocumentPosition(document.getElementById('span1')),
      ).toEqual(2)
      expect(
        replicaDocument.getElementById('span2').compareDocumentPosition(replicaDocument.getElementById('span1')),
      ).toEqual(2)
    })

    it('returns 20 if b is contained by a', () => {
      const div = document.createElement('div')
      div.id = 'parent'
      const span = document.createElement('span')
      span.id = 'child'

      div.appendChild(span)
      document.body.appendChild(div)

      const position = document
        .getElementById('parent')
        .compareDocumentPosition(document.getElementById('child'))
      expect(position).toEqual(20)
      const rposition = replicaDocument
        .getElementById('parent')
        .compareDocumentPosition(replicaDocument.getElementById('child'))
      expect(rposition).toEqual(20)
    })

    it('returns 10 if b contains a', () => {
      const div = document.createElement('div')
      div.id = 'parent'
      const span = document.createElement('span')
      span.id = 'child'

      div.appendChild(span)
      document.body.appendChild(div)

      const position = document
        .getElementById('child')
        .compareDocumentPosition(document.getElementById('parent'))
      expect(position).toEqual(10)
      const rposition = replicaDocument
        .getElementById('child')
        .compareDocumentPosition(replicaDocument.getElementById('parent'))
      expect(rposition).toEqual(10)
    })
  })

  describe('normalize()', () => {
    it('normalizes an element.', () => {
      const txt = document.createTextNode.bind(document)
      const { primary, replica } = testElement('div')
      const span = document.createElement('span')
      span.append(txt('sp'), txt('an'))
      const b = document.createElement('b')
      b.append(txt(''), txt(''), txt(''))
      primary.append(txt(''), txt('d'), txt(''), txt('i'), txt('v'), span, txt(''), b, txt(''))
      expect(primary.childNodes).toHaveLength(9)
      primary.normalize()
      expect(replica.childNodes).toHaveLength(3)
      expect(replica.childNodes[0]).toBeInstanceOf(Text)
      expect(replica.childNodes[0]!.nodeValue).toBe('div')
			 // @ts-expect-error property should exist
      expect(replica.childNodes[1].tagName).toBe('SPAN')
			 // @ts-expect-error property should exist
      expect(replica.childNodes[2].tagName).toBe('B')
      expect(span.childNodes).toHaveLength(1)
      expect(span.childNodes[0]).toBeInstanceOf(Text)
      expect(span.childNodes[0]!.nodeValue).toBe('span')
      expect(b.childNodes).toHaveLength(0)
    })

    it('normalizes a document fragment.', () => {
      const txt = document.createTextNode.bind(document)
      const fragment = document.createDocumentFragment()

      document.body.appendChild(fragment)

      const span = document.createElement('span')
      span.append(txt('sp'), txt('an'))
      const b = document.createElement('b')
      b.append(txt(''), txt(''), txt(''))
      fragment.append(txt(''), txt('d'), txt(''), txt('i'), txt('v'), span, txt(''), b, txt(''))
      expect(fragment.childNodes).toHaveLength(9)
      fragment.normalize()
      expect(fragment.childNodes).toHaveLength(3)
      expect(fragment.childNodes[0]).toBeInstanceOf(Text)
      expect(fragment.childNodes[0]!.nodeValue).toBe('div')
      expect(fragment.childNodes[1]).toBe(span)
      expect(fragment.childNodes[2]).toBe(b)
      expect(span.childNodes).toHaveLength(1)
      expect(span.childNodes[0]).toBeInstanceOf(Text)
      expect(span.childNodes[0]!.nodeValue).toBe('span')
      expect(b.childNodes).toHaveLength(0)
    })

    it('normalizes the document.', () => {
      const count = document.childNodes.length
      document.append(document.createTextNode(''))
      expect(document.childNodes).toHaveLength(count + 1)
      expect(replicaDocument.childNodes).toHaveLength(count + 1)
      document.normalize()
      expect(document.childNodes).toHaveLength(count)
      expect(replicaDocument.childNodes).toHaveLength(count)
    })

    it('does nothing on a text node.', () => {
      const { primary, replica } = testElement('div')
      const node = primary.appendChild(document.createTextNode(''))
      node.normalize()
      expect(replica.childNodes).toHaveLength(1)
      expect(replica.childNodes[0] instanceof Text).toBe(true)
    })
  })

  describe('isSameNode()', () => {
    it('returns true if the nodes are the same.', () => {
      const { primary, replica } = testElement('div')
      expect(primary.isSameNode(primary)).toBe(true)
      expect(replica.isSameNode(replica)).toBe(true)
    })

    it('returns false if the nodes are not the same.', () => {
      const { primary: p1, replica: r1 } = testElement('div')
      const { primary: p2, replica: r2 } = testElement('div')

      expect(p1.isSameNode(p2)).toBe(false)
      expect(r1.isSameNode(r2)).toBe(false)

      expect(p1.isSameNode(r1)).toBe(false)
      expect(p2.isSameNode(r2)).toBe(false)
    })
  })
})
